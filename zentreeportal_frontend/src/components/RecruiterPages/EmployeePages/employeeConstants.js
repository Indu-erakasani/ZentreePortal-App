// // ── Dropdown Options ──────────────────────────────────────────────────────────
// export const EMP_STATUSES      = ["Active", "On Bench", "On Notice", "Resigned", "Terminated"];
// export const EMPLOYMENT_TYPES  = ["Permanent", "Contract", "C2H", "Freelance"];
// export const CURRENCIES        = ["INR", "USD", "GBP", "EUR", "AED"];
// export const DEPARTMENTS       = [
//   "Engineering", "QA & Testing", "DevOps & Cloud", "Design & UX",
//   "Data & Analytics", "Management", "Sales", "HR", "Finance", "Other",
// ];
// export const BGV_STATUSES      = ["Not Initiated", "Initiated", "In Progress", "Completed", "Failed"];
// export const DOCUMENT_STATUSES = ["Pending", "Received", "Verified", "Waived"];
// export const ACCOUNT_TYPES     = ["Savings", "Current", "NRE", "NRO"];
// export const BLOOD_GROUPS      = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// export const DOCUMENT_CATEGORIES = {
//   Identity:     ["Aadhar Card", "PAN Card", "Passport", "Voter ID", "Driving License"],
//   Address:      ["Utility Bill", "Rental Agreement", "Bank Statement (Address Proof)"],
//   Education:    ["10th Marksheet", "12th Marksheet", "Graduation Certificate",
//                  "PG Certificate", "Professional Certifications"],
//   Professional: ["Previous Offer Letter", "Relieving Letter", "Experience Letter",
//                  "Last 3 Months Payslips", "Form 16"],
//   Medical:      ["Medical Fitness Certificate", "Health Declaration Form"],
//   Other:        ["Photograph", "Signed Offer Letter", "Signed NDA", "Signed Employment Agreement"],
// };

// // ── Color Maps ────────────────────────────────────────────────────────────────
// export const STATUS_COLOR = {
//   Active: "success", "On Bench": "warning", "On Notice": "info",
//   Resigned: "error", Terminated: "error",
// };
// export const DOC_STATUS_COLOR = {
//   Pending: "warning", Received: "info", Verified: "success", Waived: "default",
// };
// export const BGV_STATUS_COLOR = {
//   "Not Initiated": "default", Initiated: "info", "In Progress": "warning",
//   Completed: "success", Failed: "error",
// };
// export const DEPT_COLOR = {
//   Engineering: "#1e40af", "QA & Testing": "#0369a1", "DevOps & Cloud": "#7e22ce",
//   "Design & UX": "#be185d", "Data & Analytics": "#0f766e", Management: "#c2410c",
//   Sales: "#15803d", HR: "#b45309", Finance: "#64748b", Other: "#475569",
// };

// // ── Empty Form Defaults ───────────────────────────────────────────────────────
// export const EMPTY_FORM = {
//   name: "", email: "", phone: "", designation: "", department: "Engineering",
//   employment_type: "Permanent", date_of_joining: "", skills: "", experience: "",
//   location: "", reporting_manager: "", status: "Active",
//   current_client: "", current_project: "", current_billing_rate: "",
//   billing_currency: "INR", salary: "", notes: "",
// };

// export const EMPTY_ENG = {
//   client_name: "", project_name: "", role: "", start_date: "", end_date: "",
//   billing_rate: "", billing_currency: "INR", work_location: "", technology: "", notes: "",
// };

// // ── Formatters ────────────────────────────────────────────────────────────────
// export const fmtDate = (iso) => {
//   if (!iso) return "—";
//   return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
// };

// export const fmtMoney = (v, currency = "INR") => {
//   if (!v) return "—";
//   if (currency === "INR") {
//     if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
//     return `₹${Number(v).toLocaleString("en-IN")}`;
//   }
//   return `${currency} ${Number(v).toLocaleString()}`;
// };

// export const nameInitials = (name = "") =>
//   name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";







// ── Dropdown Options ──────────────────────────────────────────────────────────
export const EMP_STATUSES      = ["Active", "On Bench", "On Notice", "Resigned", "Terminated"];
export const EMPLOYMENT_TYPES  = ["Permanent", "Contract", "C2H", "Freelance"];
export const CURRENCIES        = ["INR", "USD", "GBP", "EUR", "AED"];
export const DEPARTMENTS       = [
  "Engineering", "QA & Testing", "DevOps & Cloud", "Design & UX",
  "Data & Analytics", "Management", "Sales", "HR", "Finance", "Other",
];
export const BGV_STATUSES      = ["Not Initiated", "Initiated", "In Progress", "Completed", "Failed"];
export const DOCUMENT_STATUSES = ["Pending", "Received", "Verified", "Waived"];
export const ACCOUNT_TYPES     = ["Savings", "Current", "NRE", "NRO"];
export const BLOOD_GROUPS      = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const DOCUMENT_CATEGORIES = {
  Identity:     ["Aadhar Card", "PAN Card", "Passport", "Voter ID", "Driving License"],
  Address:      ["Utility Bill", "Rental Agreement", "Bank Statement (Address Proof)"],
  Education:    ["10th Marksheet", "12th Marksheet", "Graduation Certificate",
                 "PG Certificate", "Professional Certifications"],
  Professional: ["Previous Offer Letter", "Relieving Letter", "Experience Letter",
                 "Last 3 Months Payslips", "Form 16"],
  Medical:      ["Medical Fitness Certificate", "Health Declaration Form"],
  Other:        ["Photograph", "Signed Offer Letter", "Signed NDA", "Signed Employment Agreement"],
};

// ── Color Maps ────────────────────────────────────────────────────────────────
export const STATUS_COLOR = {
  Active: "success", "On Bench": "warning", "On Notice": "info",
  Resigned: "error", Terminated: "error",
};
export const DOC_STATUS_COLOR = {
  Pending: "warning", Received: "info", Verified: "success", Waived: "default",
};
export const BGV_STATUS_COLOR = {
  "Not Initiated": "default", Initiated: "info", "In Progress": "warning",
  Completed: "success", Failed: "error",
};
export const DEPT_COLOR = {
  Engineering: "#1e40af", "QA & Testing": "#0369a1", "DevOps & Cloud": "#7e22ce",
  "Design & UX": "#be185d", "Data & Analytics": "#0f766e", Management: "#c2410c",
  Sales: "#15803d", HR: "#b45309", Finance: "#64748b", Other: "#475569",
};

// ── Empty Form Defaults ───────────────────────────────────────────────────────
export const EMPTY_FORM = {
  emp_id: "", name: "", email: "", phone: "", designation: "", department: "Engineering",
  employment_type: "Permanent", date_of_joining: "", skills: "", experience: "",
  location: "", reporting_manager: "", status: "Active",
  current_client: "", current_project: "", current_billing_rate: "",
  billing_currency: "INR", salary: "", notes: "",
};

export const EMPTY_ENG = {
  client_name: "", project_name: "", role: "", start_date: "", end_date: "",
  billing_rate: "", billing_currency: "INR", work_location: "", technology: "", notes: "",
};

// ── Formatters ────────────────────────────────────────────────────────────────
export const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const fmtMoney = (v, currency = "INR") => {
  if (!v) return "—";
  if (currency === "INR") {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    return `₹${Number(v).toLocaleString("en-IN")}`;
  }
  return `${currency} ${Number(v).toLocaleString()}`;
};

export const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";