export function getApiErrorMessage(error, fallback = "Something went wrong") {
  const detail = error?.response?.data?.detail ?? error?.response?.data ?? error?.message;

  if (!detail) return fallback;
  if (typeof detail === "string") return detail;

  // FastAPI/Pydantic validation errors can be an array of issues
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => {
        if (!d) return null;
        if (typeof d === "string") return d;
        if (typeof d?.msg === "string") return d.msg;
        return null;
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join(", ");
    return fallback;
  }

  // Sometimes FastAPI returns an object like { detail: { msg: ... } } or { msg: ... }
  if (typeof detail === "object") {
    if (typeof detail?.msg === "string") return detail.msg;
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

