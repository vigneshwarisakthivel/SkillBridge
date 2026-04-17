// src/apiServices.js

const BASE_URL = "https://skillbridge-4tqu.onrender.com/api";

// 🔥 GLOBAL API HANDLER
const apiFetch = async (url, options = {}) => {
  const access = localStorage.getItem("access");

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  // 🔥 TOKEN EXPIRED → REDIRECT ALL PAGES
  if (res.status === 401 || data?.code === "token_not_valid") {
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }

  // 🔥 OTHER ERRORS
  if (!res.ok) {
    throw data;
  }

  return data;
};

// ─── AUTH ─────────────────────────────────────────────

export const registerUser = (data) =>
  apiFetch("/register/", { method: "POST", body: JSON.stringify(data) });

export const loginUser = (data) =>
  apiFetch("/login/", { method: "POST", body: JSON.stringify(data) });

export const logoutUser = async () => {
  await apiFetch("/logout/", {
    method: "POST",
    body: JSON.stringify({ refresh: localStorage.getItem("refresh") }),
  });
  localStorage.clear();
};

// ─── PROFILE ──────────────────────────────────────────

export const uploadProfile = (file) => {
  const fd = new FormData();
  fd.append("image", file);
  return apiFetch("/profile/upload/", { method: "POST", body: fd });
};

export const getProfile = () => apiFetch("/profile/");

// ─── NOTIFICATIONS ────────────────────────────────────

export const getNotifications = () =>
  apiFetch("/notifications/");

export const markNotificationRead = (id) =>
  apiFetch(`/notifications/${id}/read/`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  apiFetch("/notifications/read-all/", { method: "PATCH" });

export const deleteNotification = (id) =>
  apiFetch(`/notifications/${id}/delete/`, { method: "DELETE" });
// ─── TESTS ────────────────────────────────────────────

export const getTests = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/tests/${qs ? `?${qs}` : ""}`);
};

export const updateTest = (testId, payload) =>
  apiFetch(`/tests/${testId}/edit/`, {
    method: "PATCH",
    body: JSON.stringify(payload),   // ✅ MUST stringify
  });

  // Get all bank questions
export const getBankQuestion = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/question/bank/${qs ? `?${qs}` : ""}`);
};


// Update a single bank question
export const updateBankQuestion = (questionId, payload) =>
  apiFetch(`/questions/bank/${questionId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload), // ✅ important
  });
  
export const getTestForEdit = (testId) =>
  apiFetch(`/tests/${testId}/edit/`);

export const sendSelectionMail = (assignment_id, message = "") =>
  apiFetch(`/assignments/${assignment_id}/send-selection/`, {
    method: "POST",
    body: JSON.stringify({ assignment_id, message }),
  });
export const createTest = (data) =>
  apiFetch("/tests/", { method: "POST", body: JSON.stringify(data) });


export const deleteTest = (id) =>
  apiFetch(`/tests/${id}/`, { method: "DELETE" });

export const setTestStatus = (id, status) =>
  apiFetch(`/tests/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ─── QUESTIONS ────────────────────────────────────────

export const getAllQuestions = () => apiFetch("/questions/");

export const uploadQuestions = (file, testId) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("test_id", testId);
  return apiFetch("/questions/upload/", { method: "POST", body: fd });
};

// ─── QUESTION BANK ───────────────────────────────────

export const getBankQuestions = () => apiFetch("/questions/bank/");

export const saveBankQuestions = (questions) =>
  apiFetch("/questions/bank/", {
    method: "POST",
    body: JSON.stringify({ questions }),
  });

export const deleteBankQuestion = (id) =>
  apiFetch(`/questions/bank/${id}/`, { method: "DELETE" });

// ─── TEST LINK ───────────────────────────────────────

export const getSecureUUID = (testId) =>
  apiFetch(`/get-secure-uuid/${testId}/`);

export const getTestLink = async (testId) => {
  const data = await getSecureUUID(testId);
  return `${window.location.origin}/test/${data?.encoded_uuid}`;
};

// ─── CANDIDATES ──────────────────────────────────────

export const getCandidates = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/candidates/${qs ? `?${qs}` : ""}`);
};

export const createCandidate = (data) =>
  apiFetch("/candidates/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteCandidate = (id) =>
  apiFetch(`/candidates/${id}/`, { method: "DELETE" });

// ─── ASSIGNMENTS ─────────────────────────────────────

export const getAssignments = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/assignments/${qs ? `?${qs}` : ""}`);
};

export const bulkAssign = (testId, candidateIds) =>
  apiFetch("/assignments/bulk/", {
    method: "POST",
    body: JSON.stringify({ test_id: testId, candidate_ids: candidateIds }),
  });

export const sendReminder = (assignmentId, message) =>
  apiFetch("/assignments/remind/", {
    method: "POST",
    body: JSON.stringify({ assignment_id: assignmentId, message }),
  });

export const getReminderLog = (assignmentId) =>
  apiFetch(`/assignments/${assignmentId}/reminders/`);

// ─── ACTIVITY ────────────────────────────────────────

export const getActivity = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/activity/${qs ? `?${qs}` : ""}`);
};

export const deleteActivity = (id) =>
  apiFetch(`/activity/${id}/`, { method: "DELETE" });

export const exportActivityCSV = (events) => {
  const headers = ["Date", "Type", "Text", "Time", "Detail"];
  const rows = events.map((e) => [e.date, e.type, `"${e.text}"`, e.time, e.detail]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "activity_log.csv";
  link.click();
};

// ─── DASHBOARD ───────────────────────────────────────

export const getDashboard = () => apiFetch("/dashboard/");

// ─── PASSWORD RESET ─────────────────────────────────

export const sendOTP = (email) =>
  apiFetch("/password-reset/send-otp/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyOTP = (email, otp) =>
  apiFetch("/password-reset/verify-otp/", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });

export const uploadAllowedEmails = (testId, emails) =>
  apiFetch("/upload-allowed-emails/", {
    method: "POST",
    body: JSON.stringify({
      test_id: testId,
      emails,
    }),
  });

export const resetPassword = (email, otp, password, confirm) =>
  apiFetch("/password-reset/reset/", {
    method: "POST",
    body: JSON.stringify({ email, otp, password, confirm }),
  });

// ─── PUBLIC TEST ────────────────────────────────────

export const getPublicTest = (uuid) =>
  apiFetch(`/tests/public/${uuid}/`);

// ─── TEST SUBMISSION ────────────────────────────────

export const submitTest = (data) =>
  apiFetch("/submit-test/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const logMalpractice = (data) =>
  apiFetch("/log-malpractice/", {
    method: "POST",
    body: JSON.stringify(data),
  });