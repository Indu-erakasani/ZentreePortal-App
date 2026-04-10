
import mongoose from "mongoose";

// ── Constants ─────────────────────────────────────────────────────────────────
export const PRIORITIES = ["Low", "Medium", "High", "Critical"];
export const STATUSES   = ["Open", "On Hold", "Closed", "Filled"];
export const JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"];
export const WORK_MODES = ["On-site", "Remote", "Hybrid"];

// ── Sub-document schemas ──────────────────────────────────────────────────────

const MCQQuestionSchema = new mongoose.Schema(
    {
        question:       { type: String, required: true },
        options:        [{ type: String, required: true }],
        correct_answer: [{ type: String, required: true }], // array supports multi-select
    },
    { _id: false }
);

const SubjectiveQuestionSchema = new mongoose.Schema(
    {
        question:         { type: String, required: true },
        reference_answer: { type: String, default: "" },
        key_points:       { type: String, default: "" },
        skill:            { type: String, default: "" },
        difficulty:       { type: String, default: "" },
    },
    { _id: false }
);

const CodingQuestionSchema = new mongoose.Schema(
    {
        programming_language: { type: String, required: true },
        question:             { type: String, required: true },
    },
    { _id: false }
);

// ── Main Job Schema ───────────────────────────────────────────────────────────

const JobSchema = new mongoose.Schema(
    {
        // ── Core identifiers ──────────────────────────────────────────────────
        job_id:      { type: String, required: true, unique: true, uppercase: true, trim: true },
        title:       { type: String, required: true, trim: true },
        client_id:   { type: String, required: true },
        client_name: { type: String, required: true },

        // ── Job details ───────────────────────────────────────────────────────
        openings:       { type: Number, required: true, min: 1 },
        filled:         { type: Number, default: 0 },
        job_type:       { type: String, enum: JOB_TYPES,  default: "Full-Time" },
        work_mode:      { type: String, enum: WORK_MODES, default: "On-site" },
        location:       { type: String, default: "" },
        experience_min: { type: Number, default: 0, min: 0 },
        experience_max: { type: Number, default: 5, min: 0 },
        salary_min:     { type: Number, default: 0 },
        salary_max:     { type: Number, default: 0 },
        skills:         [{ type: String }],
        description:    { type: String, default: "" },
        priority:       { type: String, enum: PRIORITIES, default: "Medium" },
        status:         { type: String, enum: STATUSES,   default: "Open" },
        deadline:       { type: Date },
        applications:   { type: Number, default: 0 },
        notes:          { type: String, default: "" },

        // ── Posted by ─────────────────────────────────────────────────────────
        posted_by:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        posted_by_name: { type: String, default: "" },

        // ── Extended JD fields ────────────────────────────────────────────────
        prefix:               { type: String, default: "" },
        hiring_manager:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        programming_language: { type: String, default: "" },
        programming_level:    { type: String, default: "" },
        secondary_skills:     [{ type: String }],

        // ── Screening test configuration ──────────────────────────────────────
        mcq_questions_count:            { type: Number, default: 0 },
        subjective_questions_count:     { type: Number, default: 0 },
        coding_questions_count:         { type: Number, default: 0 },
        screening_time_minutes:         { type: Number, default: 0 },
        screening_test_pass_percentage: { type: String, default: "" },

        // ── Question banks ────────────────────────────────────────────────────
        mcq_questions:        [MCQQuestionSchema],
        subjective_questions: [SubjectiveQuestionSchema],
        coding_questions:     [CodingQuestionSchema],

        // ── Contacts ──────────────────────────────────────────────────────────
        recruiter_contacts:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        interviewer_contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        // ── Lifecycle & meta ──────────────────────────────────────────────────
        is_active:            { type: Boolean, default: true },
        expiration_time:      { type: Date },
        application_deadline: { type: Date },
        number_of_vacancies:  { type: Number, min: 1 },
        open_positions:       { type: Number, min: 1 },
        preferred_location:   { type: String, default: "" },
        department:           { type: String, default: "" },
        remarks:              { type: String, default: "" },
        jd_edit_status:       { type: String, default: "" },
    },
    {
        // auto-manages created_at and updated_at
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        toJSON:     { virtuals: true },
        toObject:   { virtuals: true },
    }
);

// ── Virtual: days_open ────────────────────────────────────────────────────────
JobSchema.virtual("days_open").get(function () {
    if (!this.created_at) return 0;
    const diff = Date.now() - new Date(this.created_at).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// ── Indexes ───────────────────────────────────────────────────────────────────
JobSchema.index({ job_id: 1 });
JobSchema.index({ client_id: 1 });
JobSchema.index({ status: 1, priority: 1 });
JobSchema.index({ title: "text", client_name: "text" });

// ── Model ─────────────────────────────────────────────────────────────────────
const Job = mongoose.model("Job", JobSchema);

export default Job;