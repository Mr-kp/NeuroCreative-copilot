"""
copilot_agent.py -- Hybrid pipeline + tool-calling agent for creative analysis.

Architecture:
  Phase 1 (pipeline): PIL features -> TRIBE V2 brain -> LightGBM v3 -> report
  Phase 2 (agent chat): LLM with tools (forecast, explain, compare, improve)

Supports: OpenAI (GPT-4o) -> Gemini -> rule-based fallback
"""

import io
import json
import math
import os
import asyncio
import numpy as np
from datetime import datetime
from pathlib import Path

from pipeline_logger import get_logger

logger = get_logger("copilot_agent")

BRAIN_SCORE_BENCHMARKS = {
    "attention": {
        "low": (0, 35, "Weak visual capture", "Add bold colors, high-contrast elements, or motion to grab attention in the first 0.3 seconds."),
        "medium": (35, 60, "Average attention pull", "Consider adding a stronger focal point, larger text, or more visual contrast to stand out in feed."),
        "high": (60, 100, "Strong visual salience", "Good attention capture. Maintain the bold visual elements while monitoring for ad blindness over time."),
        "neuroscience": "Attention reflects activity in the ventral attention network and visual cortex. Ads that trigger pop-out effects (high contrast, motion, faces) activate this network within 100-300ms.",
    },
    "reward": {
        "low": (0, 35, "Weak value signal", "Make the value proposition clearer -- add price, discount badge, or emphasize the benefit headline."),
        "medium": (35, 60, "Moderate reward anticipation", "Strengthen the reward signal by making the offer more prominent or adding social proof elements."),
        "high": (60, 100, "Strong reward activation", "Excellent value communication. The ventral striatum response suggests viewers anticipate real value."),
        "neuroscience": "Reward processing involves the ventral striatum and ventromedial prefrontal cortex. Clear value propositions, discount badges, and brand visibility activate these regions, predicting purchase intent.",
    },
    "memory": {
        "low": (0, 35, "Poor encoding likelihood", "Simplify the creative. Reduce visual complexity, use a single clear message, and increase brand element size."),
        "medium": (35, 60, "Moderate encoding strength", "Memory encoding could improve with simpler layouts, repetition of key elements, or more distinctive brand assets."),
        "high": (60, 100, "Strong encoding potential", "Good memorability. The creative uses simple, distinctive elements that aid hippocampal encoding."),
        "neuroscience": "Memory encoding requires 2-3 seconds of sustained attention in the hippocampus and medial temporal lobe. Simplicity, emotional anchoring, and distinctive brand assets improve encoding by 40%.",
    },
    "emotion": {
        "low": (0, 35, "Low emotional engagement", "Add human faces (38% attention boost), warmer color palette, or narrative elements to drive emotional response."),
        "medium": (35, 60, "Moderate emotional response", "Emotional engagement could be stronger. Consider UGC-style content, relatable scenarios, or aspirational imagery."),
        "high": (60, 100, "Strong emotional activation", "Excellent emotional engagement. The amygdala response suggests the creative resonates affectively with viewers."),
        "neuroscience": "Emotional processing in the amygdala and insula drives engagement and sharing behavior. Faces increase attention by 38%, authentic (UGC) content by 27%, and warm color tones by 15%.",
    },
    "visual_load": {
        "low": (0, 35, "Clean, easy to process", "The creative is visually simple, which aids rapid processing. Consider if you're missing impact opportunities."),
        "medium": (35, 60, "Balanced complexity", "Visual complexity is in the optimal zone -- enough to be interesting, not so much as to overwhelm."),
        "high": (60, 100, "High cognitive demand", "Reduce visual clutter. Each additional element beyond 5 reduces CTR by ~4% and recall by ~7%. Simplify the layout."),
        "neuroscience": "Visual load reflects prefrontal cortex engagement. Cognitive overload (>5 competing elements) reduces CTR by 22% and recall by 35%. The brain's processing capacity caps at ~4 objects simultaneously.",
    },
}

IMPROVEMENT_TEMPLATES = {
    "attention": {
        "low": [
            "Increase contrast between foreground and background by 40-60%",
            "Add a strong visual hook in the top-right quadrant (natural eye landing zone)",
            "Use complementary colors (e.g., orange/blue, red/green) for pop-out effects",
            "Consider adding subtle animation or motion elements for video formats",
        ],
        "medium": [
            "Make the primary CTA or headline 15-20% larger",
            "Add a directional cue (arrow, gaze line) pointing to the key message",
            "Increase whitespace around the main focal point by 25%",
        ],
    },
    "reward": {
        "low": [
            "Add a clear price or discount badge in the upper-third of the creative",
            "Increase brand logo size by 30-50% and position in the gaze path",
            "Show the product in-use or in-context to convey tangible benefit",
        ],
        "medium": [
            "Add social proof ('10K+ downloads', '4.8 stars') near the CTA",
            "Use benefit-driven headline framing ('Save 50%' vs 'Discount available')",
        ],
    },
    "memory": {
        "low": [
            "Reduce to a single, clear message -- remove secondary text elements",
            "Increase brand asset size and use consistent brand colors throughout",
            "Add a distinctive visual element (mascot, unique pattern) that anchors recall",
        ],
        "medium": [
            "Ensure the key message is readable in under 2 seconds",
            "Add repetition of the brand element (logo in 2 positions)",
        ],
    },
    "emotion": {
        "low": [
            "Add a human face making eye contact with the camera (38% attention boost)",
            "Shift to warmer color tones (coral, amber) which increase positive valence",
            "Use authentic/UGC-style imagery instead of polished stock photos",
        ],
        "medium": [
            "Add an aspirational lifestyle element that connects emotionally",
            "Use micro-copy with emotional triggers ('Your journey starts here')",
        ],
    },
    "fatigue": {
        "high": [
            "Rotate creative concept every 12-14 days to prevent ad blindness",
            "A/B test a fundamentally different visual approach (new color scheme, layout)",
            "Reduce exposure frequency to maintain novelty signal",
        ],
        "medium": [
            "Refresh visual elements while keeping the core concept (swap images, update copy)",
            "Test a new CTA variation to re-engage viewers who have seen the ad",
        ],
    },
}


def forecast_decay(analysis: dict, days_ahead: int = 30, ctr_override: float = None) -> dict:
    fp = analysis.get("ml_prediction", {}).get("fatigue_probability", 0.5)
    initial_ctr = ctr_override or analysis.get("ml_prediction", {}).get("initial_ctr", 0.025)

    decay_lambda = fp * 0.04 + 0.005

    half_life = math.log(2) / decay_lambda if decay_lambda > 0 else 999

    fatigue_onset_day = None
    critical_day = None
    projected = []

    for d in range(days_ahead + 1):
        ctr = initial_ctr * math.exp(-decay_lambda * d)
        projected.append({"day": d, "ctr": round(ctr, 6)})

        if fatigue_onset_day is None and ctr < initial_ctr * 0.7:
            fatigue_onset_day = d
        if critical_day is None and ctr < initial_ctr * 0.5:
            critical_day = d

    milestones = []
    if fatigue_onset_day:
        milestones.append({"day": fatigue_onset_day, "label": "Fatigue onset", "ctr": round(initial_ctr * 0.7, 6)})
    if critical_day:
        milestones.append({"day": critical_day, "label": "Critical decay", "ctr": round(initial_ctr * 0.5, 6)})

    return {
        "initial_ctr": round(initial_ctr, 6),
        "decay_rate": round(decay_lambda, 4),
        "half_life_days": round(half_life, 1),
        "fatigue_onset_day": fatigue_onset_day,
        "critical_day": critical_day,
        "projected": projected,
        "milestones": milestones,
        "_summary": f"CTR decays from {initial_ctr*100:.2f}% to {projected[-1]['ctr']*100:.2f}% in {days_ahead} days. Half-life: {half_life:.0f} days.",
    }


def explain_brain_scores(scores: dict, focus_area: str = "all") -> dict:
    dimensions = ["attention", "reward", "memory", "emotion", "visual_load"]
    if focus_area != "all" and focus_area in dimensions:
        dimensions = [focus_area]

    explanations = []
    for dim in dimensions:
        score = scores.get(dim, 50)
        bench = BRAIN_SCORE_BENCHMARKS.get(dim, {})

        level = "medium"
        level_info = bench.get("medium", ("", "", "Average", ""))
        for lvl in ["low", "medium", "high"]:
            lo, hi, label, advice = bench[lvl]
            if lo <= score < hi:
                level = lvl
                level_info = (lo, hi, label, advice)
                break

        explanations.append({
            "dimension": dim,
            "score": round(score, 1),
            "level": level,
            "label": level_info[2],
            "advice": level_info[3],
            "neuroscience": bench.get("neuroscience", ""),
        })

    return {
        "focus_area": focus_area,
        "explanations": explanations,
        "_summary": f"Explained {len(explanations)} brain score dimensions. Focus: {focus_area}.",
    }


def suggest_improvements(analysis: dict, focus: str = "all") -> list:
    brain = analysis.get("brain_scores", {})
    fp = analysis.get("ml_prediction", {}).get("fatigue_probability", 0.5)

    suggestions = []
    dims = ["attention", "reward", "memory", "emotion"] if focus in ("all", "engagement") else \
           ["attention"] if focus == "attention" else \
           ["fatigue"] if focus == "fatigue" else \
           ["reward", "memory"]

    for dim in dims:
        score = brain.get(dim, 50)
        if dim == "fatigue":
            level = "high" if fp > 0.6 else "medium" if fp > 0.35 else "low"
        else:
            level = "low" if score < 35 else "medium" if score < 60 else "high"

        if level in ("low", "medium") and dim in IMPROVEMENT_TEMPLATES:
            templates = IMPROVEMENT_TEMPLATES[dim].get(level, [])
            for i, t in enumerate(templates[:2]):
                suggestions.append({
                    "area": dim.capitalize(),
                    "priority": "high" if level == "low" else "medium",
                    "action": t,
                    "current_score": round(score if dim != "fatigue" else fp * 100, 1),
                    "target_score": round(score + 15 if dim != "fatigue" else (fp - 0.2) * 100, 1),
                })

    suggestions.sort(key=lambda x: 0 if x["priority"] == "high" else 1)

    return suggestions


def compare_creatives(analyses: list, comparison_type: str = "overall") -> dict:
    if len(analyses) < 2:
        return {"error": "Need at least 2 analyses to compare", "_summary": "Insufficient data for comparison."}

    comparison = {
        "creatives": [],
        "winner": None,
        "insights": [],
        "dimensions": {},
    }

    scores_by_creative = {}
    for a in analyses:
        brain = a.get("brain_scores", {})
        ml = a.get("ml_prediction", {})
        summary = a.get("executive_summary", {})
        cid = a.get("id", "unknown")

        overall = summary.get("overall_score", 50)
        scores_by_creative[cid] = overall

        comparison["creatives"].append({
            "id": cid,
            "filename": a.get("filename", ""),
            "grade": summary.get("grade", "C"),
            "overall_score": overall,
            "brain_scores": brain,
            "status": ml.get("status", "stable"),
            "fatigue_probability": ml.get("fatigue_probability", 0.5),
        })

    winner_id = max(scores_by_creative, key=scores_by_creative.get)
    comparison["winner"] = winner_id

    dims = ["attention", "reward", "memory", "emotion", "visual_load"]
    for dim in dims:
        values = {}
        for a in analyses:
            cid = a.get("id", "unknown")
            values[cid] = a.get("brain_scores", {}).get(dim, 50)
        best = max(values, key=values.get)
        worst = min(values, key=values.get)
        comparison["dimensions"][dim] = {"values": values, "best": best, "worst": worst}

    comparison["insights"] = [
        f"Creative '{winner_id}' leads with an overall score of {scores_by_creative[winner_id]}/100.",
        f"Largest performance gap: {max(comparison['dimensions'].values(), key=lambda x: max(x['values'].values()) - min(x['values'].values()))}.",
    ]

    comparison["_summary"] = f"Compared {len(analyses)} creatives. Winner: {winner_id} ({scores_by_creative[winner_id]}/100)."
    return comparison


def compute_executive_summary(analysis: dict) -> dict:
    brain = analysis.get("brain_scores", {})
    ml = analysis.get("ml_prediction", {})

    att = brain.get("attention", 50)
    rew = brain.get("reward", 50)
    mem = brain.get("memory", 50)
    emo = brain.get("emotion", 50)
    vload = brain.get("visualLoad", 50)
    fp = ml.get("fatigue_probability", 0.5)
    perf = ml.get("performance_score", 50)
    avg_brain = (att + rew + mem + emo + vload) / 5

    raw_score = (
        (100 - avg_brain) * 0.25 +
        perf * 0.30 +
        (1 - fp) * 100 * 0.25 +
        emo * 0.10 +
        rew * 0.10
    )
    overall_score = round(max(0, min(100, raw_score)))

    if overall_score >= 85:
        grade = "A"
    elif overall_score >= 75:
        grade = "B+"
    elif overall_score >= 65:
        grade = "B"
    elif overall_score >= 55:
        grade = "C+"
    elif overall_score >= 45:
        grade = "C"
    elif overall_score >= 35:
        grade = "D"
    else:
        grade = "F"

    strengths = []
    weaknesses = []

    if emo >= 65:
        strengths.append(f"Strong emotional engagement ({emo:.0f}/100) -- viewers connect affectively")
    if rew >= 65:
        strengths.append(f"High reward signal ({rew:.0f}/100) -- clear value proposition")
    if att >= 65:
        strengths.append(f"Good attention capture ({att:.0f}/100) -- strong visual salience")
    if mem >= 65:
        strengths.append(f"Strong encoding potential ({mem:.0f}/100) -- memorable design")
    if vload <= 40:
        strengths.append(f"Low cognitive load ({vload:.0f}/100) -- easy to process")
    if fp < 0.3:
        strengths.append(f"Low fatigue risk ({fp*100:.0f}%) -- expected long creative lifespan")

    if att < 40:
        weaknesses.append(f"Weak attention capture ({att:.0f}/100) -- creative may be overlooked")
    if rew < 40:
        weaknesses.append(f"Low reward signal ({rew:.0f}/100) -- value proposition unclear")
    if mem < 40:
        weaknesses.append(f"Poor encoding potential ({mem:.0f}/100) -- unlikely to be remembered")
    if vload > 65:
        weaknesses.append(f"High cognitive load ({vload:.0f}/100) -- visually overwhelming")
    if fp > 0.6:
        weaknesses.append(f"High fatigue risk ({fp*100:.0f}%) -- will decay quickly")

    if not strengths:
        strengths.append("No critical weaknesses detected")
    if not weaknesses:
        weaknesses.append("No major issues identified")

    top_actions = []
    if weaknesses:
        for w in weaknesses[:3]:
            top_actions.append(w)
    if len(top_actions) < 3 and strengths:
        for s in strengths[:3 - len(top_actions)]:
            top_actions.append(f"Leverage: {s}")

    return {
        "grade": grade,
        "overall_score": overall_score,
        "top_actions": top_actions[:3],
        "strengths": strengths[:3],
        "weaknesses": weaknesses[:3],
    }


def generate_heatmap(image_bytes: bytes) -> dict:
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((64, 64))
        arr = np.array(img, dtype=np.float64)

        gray = np.mean(arr, axis=2)
        edges = np.abs(np.diff(gray, axis=0, prepend=0)) + np.abs(np.diff(gray, axis=1, prepend=0))
        edges = edges / (edges.max() + 1e-6)

        brightness = gray / 255.0
        center_weight = np.ones_like(gray)
        cy, cx = gray.shape[0] // 2, gray.shape[1] // 2
        for y in range(gray.shape[0]):
            for x in range(gray.shape[1]):
                dist = math.sqrt((y - cy)**2 + (x - cx)**2) / math.sqrt(cy**2 + cx**2)
                center_weight[y, x] = max(0, 1 - dist * 0.3)

        saliency = edges * 0.5 + brightness * 0.25 + center_weight * 0.25
        saliency = (saliency - saliency.min()) / (saliency.max() - saliency.min() + 1e-6)

        grid_8x8 = np.zeros((8, 8))
        for gy in range(8):
            for gx in range(8):
                block = saliency[gy*8:(gy+1)*8, gx*8:(gx+1)*8]
                grid_8x8[gy, gx] = float(block.mean())

        flat = grid_8x8.flatten()
        top_idx = np.argsort(flat)[-3:]
        hotspots = []
        for idx in top_idx:
            gy, gx = divmod(int(idx), 8)
            hotspots.append({
                "x": round((gx + 0.5) / 8, 3),
                "y": round((gy + 0.5) / 8, 3),
                "intensity": round(float(flat[idx]), 3),
            })

        return {
            "grid": grid_8x8.tolist(),
            "hotspots": hotspots,
        }
    except Exception as e:
        logger.warning(f"Heatmap generation failed: {e}")
        return {"grid": [[0.5]*8 for _ in range(8)], "hotspots": []}


TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "forecast_decay",
            "description": "Predict CTR performance decay over time. Use when the user asks about when to refresh, how long the creative will perform, optimal refresh timing, or decay timeline.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_ahead": {"type": "integer", "description": "Number of days to forecast ahead", "default": 30},
                    "ctr_override": {"type": "number", "description": "Override starting CTR (e.g., 0.03 for 3%). Use when user asks 'what if CTR was higher?'"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "explain_brain_scores",
            "description": "Get detailed neuroscience interpretation of brain scores. Use when the user asks what the scores mean, which dimensions matter most, or wants a deep explanation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "focus_area": {
                        "type": "string",
                        "enum": ["all", "attention", "reward", "memory", "emotion", "visual_load"],
                        "description": "Which brain dimension to focus on",
                        "default": "all",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "suggest_improvements",
            "description": "Generate specific, actionable improvement suggestions. Use when the user asks how to improve, optimize, or fix the creative.",
            "parameters": {
                "type": "object",
                "properties": {
                    "focus": {
                        "type": "string",
                        "enum": ["all", "attention", "engagement", "fatigue", "conversion"],
                        "description": "Improvement focus area",
                        "default": "all",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_creatives",
            "description": "Compare multiple creative analyses side by side. Use when the user asks to compare creatives or asks which one is better.",
            "parameters": {
                "type": "object",
                "properties": {
                    "comparison_type": {
                        "type": "string",
                        "enum": ["overall", "brain_scores", "fatigue_risk", "forecast"],
                        "description": "What aspect to compare",
                        "default": "overall",
                    },
                },
                "required": [],
            },
        },
    },
]

TOOL_LABELS = {
    "forecast_decay": "Computing decay forecast...",
    "explain_brain_scores": "Analyzing brain scores...",
    "suggest_improvements": "Generating improvement suggestions...",
    "compare_creatives": "Comparing creatives...",
}


class CopilotAgent:
    def __init__(self):
        self.openai_client = None
        self.gemini_model = None
        self.provider = "rule_based"
        self.model_name = "rule-based"
        self._init_llm()

    def _init_llm(self):
        openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if openai_key:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=openai_key)
                model = os.environ.get("COPILOT_OPENAI_MODEL", "gpt-4o").strip()
                self.model_name = model
                self.provider = "openai"
                logger.info(f"Copilot agent: OpenAI ({model})")
                return
            except ImportError:
                logger.warning("openai package not installed")

        gemini_key = os.environ.get("GOOGLE_API_KEY", "").strip()
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = os.environ.get("COPILOT_GEMINI_MODEL", "gemini-2.5-flash").strip()
                self.gemini_model = genai.GenerativeModel(
                    model_name=model,
                    system_instruction=self._system_prompt(),
                )
                self.model_name = model
                self.provider = "gemini"
                logger.info(f"Copilot agent: Gemini ({model})")
                return
            except ImportError:
                logger.warning("google-generativeai not installed")

        logger.info("Copilot agent: rule-based fallback (no LLM keys)")

    def _system_prompt(self) -> str:
        return """You are NeuroCreative Copilot — an expert neuroscience-aware ad creative analyst. You have access to the full creative analysis results and can use tools to provide deeper insights.

## Your Capabilities
You can analyze creatives through a neuroscience lens, predict performance decay, explain brain scores, suggest improvements, and compare multiple creatives. You have access to TRIBE V2 brain model results and LightGBM v3 ML predictions.

## Key Principles
- Be specific: reference actual scores and metrics
- Be actionable: every suggestion should be something the user can do
- Use neuroscience: explain WHY something works in terms of brain processing
- Be concise: 2-4 sentences per response unless elaboration is requested

## Key Research
- Neural efficiency: top performers show LOWER brain activation (efficient processing)
- Attention peaks at 0.3-0.8 seconds; first frame determines 80% of engagement
- Cognitive overload (>5 elements) reduces CTR by 22% and recall by 35%
- Faces increase attention by 38% and engagement by 27%
- Creative fatigue follows exponential decay: CTR typically halves every 14-21 days
- Motion score is the #1 predictor of fatigue (Cox PH hazard ratio = 5.51)

When using tools, explain what you found in natural language after the tool returns results."""

    def _build_messages(self, user_message: str, analyses: list, history: list) -> list:
        messages = [{"role": "system", "content": self._system_prompt()}]

        if analyses:
            ctx_parts = []
            for a in analyses:
                brain = a.get("brain_scores", {})
                ml = a.get("ml_prediction", {})
                summary = a.get("executive_summary", {})
                decay = a.get("decay_forecast", {})
                ctx_parts.append(
                    f"Creative: {a.get('filename', 'unknown')} (ID: {a.get('id', '?')})\n"
                    f"  Grade: {summary.get('grade', '?')}, Score: {summary.get('overall_score', '?')}/100\n"
                    f"  Brain: att={brain.get('attention',0):.0f} rew={brain.get('reward',0):.0f} "
                    f"mem={brain.get('memory',0):.0f} emo={brain.get('emotion',0):.0f} load={brain.get('visualLoad',0):.0f}\n"
                    f"  Status: {ml.get('status', '?')}, Fatigue: {ml.get('fatigue_probability',0):.0%}\n"
                    f"  Decay half-life: {decay.get('half_life_days', '?')} days\n"
                    f"  Action: {a.get('recommendation', {}).get('action', '?')}\n"
                    f"  Strengths: {', '.join(summary.get('strengths', []))}\n"
                    f"  Weaknesses: {', '.join(summary.get('weaknesses', []))}"
                )
            messages.append({"role": "system", "content": f"ANALYSIS CONTEXT:\n\n" + "\n\n".join(ctx_parts)})

        for h in history[-10:]:
            messages.append(h)

        messages.append({"role": "user", "content": user_message})
        return messages

    def _execute_tool(self, name: str, args: dict, analyses: list) -> dict:
        try:
            if name == "forecast_decay":
                if not analyses:
                    return {"error": "No analysis available", "_summary": "No creative analyzed yet."}
                return forecast_decay(analyses[0], **args)

            elif name == "explain_brain_scores":
                if not analyses:
                    return {"error": "No analysis available", "_summary": "No creative analyzed yet."}
                return explain_brain_scores(analyses[0].get("brain_scores", {}), **args)

            elif name == "suggest_improvements":
                if not analyses:
                    return {"error": "No analysis available", "_summary": "No creative analyzed yet."}
                suggestions = suggest_improvements(analyses[0], **args)
                return {"suggestions": suggestions, "_summary": f"Generated {len(suggestions)} improvement suggestions."}

            elif name == "compare_creatives":
                if len(analyses) < 2:
                    return {"error": "Upload at least 2 creatives to compare", "_summary": "Need 2+ creatives."}
                return compare_creatives(analyses, **args)

            return {"error": f"Unknown tool: {name}"}
        except Exception as e:
            logger.error(f"Tool execution error ({name}): {e}")
            return {"error": str(e), "_summary": f"Tool error: {e}"}

    async def chat(self, message: str, analyses: list, history: list):
        if self.provider == "openai":
            async for evt in self._run_openai(message, analyses, history):
                yield evt
        elif self.provider == "gemini":
            async for evt in self._run_gemini(message, analyses, history):
                yield evt
        else:
            async for evt in self._run_rule_based(message, analyses):
                yield evt

    async def _run_openai(self, message: str, analyses: list, history: list):
        import asyncio as _asyncio

        messages = self._build_messages(message, analyses, history)

        for round_num in range(3):
            yield {"event": "thinking", "data": json.dumps({"round": round_num + 1})}

            try:
                response = await _asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.openai_client.chat.completions.create(
                        model=self.model_name,
                        messages=messages,
                        tools=TOOL_SCHEMAS,
                        max_tokens=800,
                        temperature=0.7,
                    )
                )
            except Exception as e:
                logger.error(f"OpenAI call failed: {e}")
                async for evt in self._run_rule_based(message, analyses):
                    yield evt
                return

            choice = response.choices[0]
            assistant_msg = choice.message

            if choice.finish_reason == "tool_calls" and assistant_msg.tool_calls:
                messages.append(assistant_msg.model_dump())

                for tc in assistant_msg.tool_calls:
                    label = TOOL_LABELS.get(tc.function.name, "Processing...")
                    yield {"event": "tool_call", "data": json.dumps({"name": tc.function.name, "label": label})}

                    args = json.loads(tc.function.arguments)
                    result = self._execute_tool(tc.function.name, args, analyses)

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result),
                    })

                    yield {"event": "tool_result", "data": json.dumps({"name": tc.function.name, "summary": result.get("_summary", "Done")})}

                continue

            elif assistant_msg.content:
                text = assistant_msg.content
                words = text.split(" ")
                for i in range(0, len(words), 3):
                    chunk = " ".join(words[i:i+3])
                    if i + 3 < len(words):
                        chunk += " "
                    yield {"event": "token", "data": json.dumps({"text": chunk})}
                    await asyncio.sleep(0.015)

                yield {"event": "done", "data": json.dumps({"status": "complete", "provider": "openai"})}
                return

        yield {"event": "done", "data": json.dumps({"status": "max_rounds"})}

    async def _run_gemini(self, message: str, analyses: list, history: list):
        try:
            context = ""
            if analyses:
                for a in analyses:
                    brain = a.get("brain_scores", {})
                    ml = a.get("ml_prediction", {})
                    context += (
                        f"Creative {a.get('filename', '?')}: "
                        f"att={brain.get('attention',0):.0f} rew={brain.get('reward',0):.0f} "
                        f"mem={brain.get('memory',0):.0f} emo={brain.get('emotion',0):.0f} "
                        f"load={brain.get('visualLoad',0):.0f}, "
                        f"status={ml.get('status','?')}, fatigue={ml.get('fatigue_probability',0):.0%}\n"
                    )

            full_prompt = f"{context}\nUser question: {message}" if context else message
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.gemini_model.generate_content(full_prompt)
            )
            text = response.text if response.text else "I couldn't generate a response."

            words = text.split(" ")
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i:i+3])
                if i + 3 < len(words):
                    chunk += " "
                yield {"event": "token", "data": json.dumps({"text": chunk})}
                await asyncio.sleep(0.015)

            yield {"event": "done", "data": json.dumps({"status": "complete", "provider": "gemini"})}
        except Exception as e:
            logger.error(f"Gemini failed: {e}")
            async for evt in self._run_rule_based(message, analyses):
                yield evt

    async def _run_rule_based(self, message: str, analyses: list):
        q = message.lower()
        answer = ""

        if not analyses:
            answer = "Upload a creative image to get started. I'll analyze it through our neuroscience and ML pipeline, then we can discuss the results."
        elif any(w in q for w in ["fatigue", "decay", "when", "how long", "refresh", "half-life"]):
            decay = forecast_decay(analyses[0])
            answer = (
                f"Based on the fatigue risk of {analyses[0]['ml_prediction']['fatigue_probability']:.0%}, "
                f"CTR is expected to decay from {decay['initial_ctr']*100:.2f}% to {decay['projected'][-1]['ctr']*100:.2f}% "
                f"over 30 days. Half-life: {decay['half_life_days']:.0f} days. "
                f"{'Refresh recommended by day ' + str(decay.get('fatigue_onset_day', '?')) + '.' if decay.get('fatigue_onset_day') else 'Low decay rate - creative should sustain.'}"
            )
        elif any(w in q for w in ["improve", "better", "change", "fix", "optimize", "suggest"]):
            suggestions = suggest_improvements(analyses[0])
            if suggestions:
                answer = "Here are the top improvements:\n" + "\n".join(
                    f"• [{s['priority'].upper()}] {s['area']}: {s['action']}" for s in suggestions[:4]
                )
            else:
                answer = "The creative is performing well with no major improvement areas. Consider A/B testing minor variations."
        elif any(w in q for w in ["brain", "score", "neural", "mean", "explain", "what"]):
            exp = explain_brain_scores(analyses[0].get("brain_scores", {}))
            answer = "Brain score analysis:\n" + "\n".join(
                f"• {e['dimension'].capitalize()} ({e['score']:.0f}/100) - {e['label']}: {e['advice'][:80]}"
                for e in exp["explanations"]
            )
        elif any(w in q for w in ["compare", "versus", "better", "which"]):
            if len(analyses) >= 2:
                comp = compare_creatives(analyses)
                answer = comp.get("_summary", "Comparison complete.") + " " + " ".join(comp.get("insights", []))
            else:
                answer = "Upload another creative to compare. I'll analyze both and tell you which one performs better and why."
        elif any(w in q for w in ["summary", "overview", "report", "grade"]):
            s = analyses[0].get("executive_summary", {})
            answer = (
                f"Grade: {s.get('grade', '?')} ({s.get('overall_score', '?')}/100). "
                f"Strengths: {'; '.join(s.get('strengths', []))}. "
                f"Areas to improve: {'; '.join(s.get('weaknesses', []))}."
            )
        else:
            brain = analyses[0].get("brain_scores", {})
            ml = analyses[0].get("ml_prediction", {})
            answer = (
                f"This creative scores {analyses[0].get('executive_summary', {}).get('grade', '?')} "
                f"with brain scores: attention={brain.get('attention',0):.0f}, reward={brain.get('reward',0):.0f}, "
                f"memory={brain.get('memory',0):.0f}, emotion={brain.get('emotion',0):.0f}, "
                f"visual load={brain.get('visualLoad',0):.0f}. "
                f"Status: {ml.get('status', '?')}, fatigue risk: {ml.get('fatigue_probability',0):.0%}. "
                f"Ask me about specific scores, improvements, or decay forecast!"
            )

        words = answer.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3])
            if i + 3 < len(words):
                chunk += " "
            yield {"event": "token", "data": json.dumps({"text": chunk})}
            await asyncio.sleep(0.02)

        yield {"event": "done", "data": json.dumps({"status": "complete", "provider": "rule_based"})}
