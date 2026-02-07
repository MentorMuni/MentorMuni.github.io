// ============================
// MentorMuni - main.js (2025)
// Modern UI • Smooth UX • Error-proof
// ============================

const API_BASE = window.MENTORMUNI_API_BASE || "https://web-production-ffcf6.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------------------
     FOOTER YEAR
  ------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();


  /* ------------------------------
     MOBILE NAVIGATION TOGGLE
  ------------------------------ */
  const nav = document.getElementById("main-nav");
  const toggle = document.getElementById("navToggle");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));

      if (!expanded) {
        nav.classList.add("nav-open");
      } else {
        nav.classList.remove("nav-open");
      }
    });

    // Close nav on clicking any link (mobile UX improvement)
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }


  /* ------------------------------
     FORM: SUBMIT TO GOOGLE SHEETS
     (via Google Apps Script Web App)
  ------------------------------ */
  const contactForm = document.getElementById("contactForm");
  const clearBtn = document.getElementById("clearForm");

  function clearContactErrors() {
    ["cfErrorName", "cfErrorEmail", "cfErrorPhone"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    });
    ["cfFieldName", "cfFieldEmail", "cfFieldPhone"].forEach(id => {
      document.getElementById(id)?.classList.remove("has-error");
    });
  }

  function showContactError(fieldId, errorId, msg) {
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
    document.getElementById(fieldId)?.classList.add("has-error");
  }

  if (contactForm) {
    contactForm.addEventListener("input", clearContactErrors);
    contactForm.addEventListener("change", clearContactErrors);

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearContactErrors();

      const name = (contactForm.querySelector("[name='name']")?.value || "").trim();
      const email = (contactForm.querySelector("[name='email']")?.value || "").trim();
      const phone = (contactForm.querySelector("[name='phone']")?.value || "").trim();

      let valid = true;
      if (!name) { showContactError("cfFieldName", "cfErrorName", "This field is required"); valid = false; }
      if (!email) { showContactError("cfFieldEmail", "cfErrorEmail", "This field is required"); valid = false; }
      if (!phone) { showContactError("cfFieldPhone", "cfErrorPhone", "This field is required"); valid = false; }
      if (!valid) return;

      const submitBtn = contactForm.querySelector("button[type='submit']");
      const originalBtnText = submitBtn?.textContent || "Submit";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Submitting..."; }

      const nameVal = (contactForm.querySelector("[name='name']")?.value || "").trim();
      const emailVal = (contactForm.querySelector("[name='email']")?.value || "").trim();
      const phoneVal = (contactForm.querySelector("[name='phone']")?.value || "").trim();
      const queryVal = (contactForm.querySelector("[name='query']")?.value || "").trim();
      const courseVal = (contactForm.querySelector("[name='course']")?.value || "").trim();

      const payload = {
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        year: null,
        message: queryVal || (courseVal ? "Course interested: " + courseVal : null)
      };

      try {
        const res = await fetch(`${API_BASE}/contact/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          alert(data.message || "Thank you! We'll get back to you.");
          contactForm.reset();
        } else {
          const errMsg = Array.isArray(data.detail)
            ? data.detail.map((d) => (typeof d === "string" ? d : d.msg || "")).filter(Boolean).join(". ") || data.detail
            : typeof data.detail === "string" ? data.detail : "Submission failed. Please try again.";
          alert(res.status === 429 ? "Too many requests. Please wait a moment." : errMsg);
        }
      } catch (err) {
        console.error("Network Error:", err);
        alert("Network error — please try again.");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalBtnText; }
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => { clearContactErrors(); contactForm.reset(); });
    }
  }


  /* ------------------------------
     MODAL HANDLERS (if any modal exists)
  ------------------------------ */
  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) modal.classList.remove("is-open");
    });
  });


  /* ------------------------------
     ENROLL BUTTON SCROLL
     Scrolls smoothly to #contact
  ------------------------------ */
  document.querySelectorAll(".enroll-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector("#contact");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });


  /* ------------------------------
     WATCH DEMO BUTTON (Optional future modal)
  ------------------------------ */
  const watchDemo = document.getElementById("watchDemo");
  if (watchDemo) {
    watchDemo.addEventListener("click", (e) => {
      e.preventDefault();
      // Replace with modal or video player later
      alert("Demo player coming soon! 🚀");
    });
  }

});
