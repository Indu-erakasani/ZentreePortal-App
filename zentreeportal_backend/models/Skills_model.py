"""
Skills Matrix schema helpers for pymongo.
All documents stored in the 'skills_matrix' collection.
"""
from datetime import datetime

DEMAND_LEVELS = ["Critical", "High", "Medium", "Low"]
CATEGORIES    = [
    "Programming Languages", "Frameworks & Libraries", "Databases",
    "Cloud & DevOps", "Data Science & ML", "Design & UX",
    "Management & Soft Skills", "Domain Expertise", "Tools & Platforms", "Other",
]


def skill_schema(
    skill_name: str,
    category: str,
    proficiency_levels: str = "",
    description: str = "",
    demand_level: str = "Medium",
    related_skills: str = "",
) -> dict:
    if demand_level not in DEMAND_LEVELS:
        raise ValueError(f"demand_level must be one of {DEMAND_LEVELS}")
    return {
        "skill_name":         skill_name.strip(),
        "category":           category,
        "proficiency_levels": proficiency_levels,
        "description":        description,
        "demand_level":       demand_level,
        "related_skills":     related_skills,
        "candidate_count":    0,
        "job_count":          0,
        "created_at":         datetime.utcnow(),
        "updated_at":         datetime.utcnow(),
    }


def serialize_skill(s: dict) -> dict:
    doc = dict(s)
    doc["_id"] = str(doc.get("_id", ""))
    for field in ("created_at", "updated_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc