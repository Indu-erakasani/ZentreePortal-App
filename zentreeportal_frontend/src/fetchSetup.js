
export async function apiRequest(url, options = {}) {

    const token = sessionStorage.getItem("token");
  
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    // Optional: global 401 handling
    if (response.status === 401 ) {
      const data = await response.json();
  
      if (data?.message === "Token Invalid/Expired") {
        console.warn("Unauthorized");
        console.log(data?.message)
  
        alert("Session expired. Redirecting to login...");
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "/Login";
      }
    }
    return response;
  }