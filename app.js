// ============================
// MentorMuni - main.js (2025)
// Modern UI • Smooth UX • Error-proof
// ============================

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

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector("button[type='submit']");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Submitting..."; }

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      // TODO: replace with your deployed Google Apps Script Web App URL
      const GAS_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

      try {
        const res = await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
          alert("🎉 Thank you! A MentorMuni counselor will reach out shortly.");
          contactForm.reset();
        } else {
          console.warn('Response not OK', res.status);
          alert("⚠️ Submission failed. Please email us at hello@mentormuni.com");
        }

      } catch (err) {
        console.error("Network Error:", err);
        alert("❗ Network error — please try again.");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Send Message"; }
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => contactForm.reset());
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
