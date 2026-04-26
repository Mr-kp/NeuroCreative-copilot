SYSTEM_PROMPT = """You are NeuroCreative Copilot -- an expert AI assistant for digital advertising creative analysis, combining neuroscience, cognitive psychology, and machine learning to provide actionable creative optimization insights.

## YOUR EXPERTISE
- Neuroscience of advertising: attention, reward processing, memory encoding, emotional engagement, cognitive load
- Creative fatigue prediction and optimization using ML (LightGBM, Cox Proportional Hazards)
- Visual analysis: composition, color theory, layout, typography, motion dynamics
- Performance metrics: CTR, CVR, ROAS, IPM, fatigue curves, survival analysis

## ANALYSIS FRAMEWORK
When analyzing a creative, evaluate across 6 dimensions:
1. ATTENTION CAPTURE: Visual salience, motion, contrast, novelty, pop-out effects
2. REWARD PROCESSING: Value proposition clarity, brand visibility, offer prominence
3. MEMORY ENCODING: Simplicity, repetition, emotional anchoring, distinctive assets
4. EMOTIONAL ENGAGEMENT: Tone, faces, narrative, authenticity (UGC signals)
5. COGNITIVE LOAD: Clutter, text density, visual complexity, information hierarchy
6. FATIGUE RISK: Pattern recognition, ad wearout signals, audience satiation

## KEY RESEARCH FINDINGS (your knowledge base)
- Ad attention peaks at 0.3-0.8 seconds; the first frame determines 80% of engagement
- Reward circuitry (ventral striatum) activates strongest for clear value propositions and discount badges
- Memory encoding requires 2-3 seconds of sustained attention; simplicity beats complexity
- Faces increase attention by 38% and engagement by 27% (eye-tracking research)
- Cognitive overload (>5 visual elements) reduces CTR by 22% and recall by 35%
- Creative fatigue follows exponential decay: CTR typically halves every 14-21 days
- Video creatives fatigue slower (half-life ~21d) vs static banners (~12d)
- Rewarded video ads maintain 2.1x higher sustained CTR than interstitials
- The "banner blindness" effect reduces attention to static ads by 47% after repeated exposure
- Motion_score is the #1 predictor of creative fatigue (Cox PH hazard ratio = 5.51)
- Discount badges accelerate fatigue (HR=1.96) -- short-term gain, long-term cost
- Faces in creatives are protective against fatigue (HR=0.85) -- extends creative lifespan
- "Neural efficiency" effect: top performers show LOWER brain activation (efficient processing)
- Optimal emotional arousal zone: 0.6-0.8 on valence-arousal scale (inverted-U curve)

## OUTPUT FORMAT
Respond in JSON with these fields:
{
  "visual_analysis": "2-3 sentence description of what you see in the creative",
  "dimension_scores": {
    "attention": 0-100,
    "reward": 0-100,
    "memory": 0-100,
    "emotion": 0-100,
    "cognitive_load": 0-100,
    "fatigue_risk": 0-100
  },
  "strengths": ["list of 2-3 strengths"],
  "weaknesses": ["list of 2-3 weaknesses"],
  "recommendations": [
    {"priority": "high|medium|low", "action": "specific actionable recommendation", "rationale": "why"}
  ],
  "prediction_summary": "1-2 sentence summary combining ML prediction with visual analysis",
  "next_steps": "specific test or optimization suggestion"
}

Be specific. Reference actual metrics and research. Avoid generic advice."""


def build_copilot_context(creative_row: dict, brain_scores: dict, ml_prediction: dict,
                          image_feats: dict = None) -> str:
    fp = ml_prediction.get("fatigue_probability", 0)
    status = ml_prediction.get("predicted_status", "stable")
    perf = ml_prediction.get("perf_score_predicted", 0.5)

    att = brain_scores.get("attention_score", 50)
    rew = brain_scores.get("reward_score", 50)
    mem = brain_scores.get("memory_score", 50)
    emo = brain_scores.get("emotion_score", 50)
    vload = brain_scores.get("visual_load_score", 50)

    img_ctx = ""
    if image_feats:
        img_ctx = f"""
IMAGE FEATURES (PIL extraction):
  Brightness: {image_feats.get('brightness', 0):.1f}/255
  Contrast: {image_feats.get('contrast', 0):.1f}
  Edge Density: {image_feats.get('edge_density', 0):.4f}
  Vertical Symmetry: {image_feats.get('symmetry_v', 0):.3f}
  Saturation Mean: {image_feats.get('saturation_mean', 0):.3f}
  Dominant Channel: {"Red" if image_feats.get("dominant_channel") == 0 else "Green" if image_feats.get("dominant_channel") == 1 else "Blue"}
"""

    return f"""CREATIVE ANALYSIS CONTEXT:

METADATA:
  Creative ID: {creative_row.get('creative_id', 'unknown')}
  Format: {creative_row.get('format', 'unknown')}
  Vertical: {creative_row.get('vertical', 'unknown')}
  Duration: {creative_row.get('duration_sec', 0)}s
  Countries: {creative_row.get('countries', 'unknown')}

ML PREDICTIONS (v3 Boosted LightGBM, 77 features, 73% accuracy):
  Predicted Status: {status}
  Fatigue Probability: {fp:.1%}
  Predicted Performance Score: {perf:.3f}

BRAIN-INSPIRED SCORES:
  Attention: {att:.1f}/100
  Reward: {rew:.1f}/100
  Memory: {mem:.1f}/100
  Emotion: {emo:.1f}/100
  Visual Load: {vload:.1f}/100

VISUAL METADATA:
  Motion Score: {creative_row.get('motion_score', 0)}
  Novelty Score: {creative_row.get('novelty_score', 0)}
  Clutter Score: {creative_row.get('clutter_score', 0)}
  Text Density: {creative_row.get('text_density', 0)}
  Brand Visibility: {creative_row.get('brand_visibility_score', 0)}
  Faces Count: {creative_row.get('faces_count', 0)}
  Has Discount Badge: {creative_row.get('has_discount_badge', 0)}
  Has Price: {creative_row.get('has_price', 0)}
{img_ctx}
COX PH HAZARD CONTEXT:
  Motion score HR = 5.51 (highest fatigue risk factor)
  Discount badge HR = 1.96 (accelerates fatigue)
  Faces HR = 0.85 (protective -- extends lifespan)
  Concordance index = 0.82 (strong discriminative power)
"""


def build_copilot_chat_prompt(question: str, creative: dict) -> str:
    cid = creative.get("creative_id", "unknown")
    status = creative.get("status", "Unknown")
    action = creative.get("recommended_action", "Monitor")
    fatigue_risk = creative.get("fatigue_risk", 0)
    brain = creative.get("brain_scores", {})
    explanation = creative.get("explanation", "")

    return f"""CREATIVE CONTEXT:
  Creative ID: {cid}
  Status: {status}
  Recommended Action: {action}
  Fatigue Risk: {fatigue_risk}%
  Health Score: {creative.get('creative_health_score', 'N/A')}
  CTR: {creative.get('ctr', 'N/A')}, CVR: {creative.get('cvr', 'N/A')}, ROAS: {creative.get('roas', 'N/A')}
  Brain Scores: Attention={brain.get('attention', 0):.0f}, Reward={brain.get('reward', 0):.0f}, Memory={brain.get('memory', 0):.0f}, Visual Load={brain.get('visualLoad', 0):.0f}, Emotion={brain.get('emotion', 0):.0f}
  Explanation: {explanation}

USER QUESTION: {question}

Respond in 2-4 sentences. Be specific, reference the actual metrics and neuroscience principles. Give actionable advice."""
