(() => {
  // ── Config (loaded async from server) ────────────────────────────────────
  let STRIPE_PK = "";

  async function loadConfig() {
    const res = await fetch("/api/config");
    const cfg = await res.json();
    STRIPE_PK = cfg.stripe_publishable_key;
  }

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const steps = {
    form:       document.getElementById("step-form"),
    payment:    document.getElementById("step-payment"),
    processing: document.getElementById("step-processing"),
    done:       document.getElementById("step-done"),
  };

  const resumeForm   = document.getElementById("resume-form");
  const paymentForm  = document.getElementById("payment-form");
  const btnCheckout  = document.getElementById("btn-checkout");
  const btnPay       = document.getElementById("btn-pay");
  const btnBack      = document.getElementById("btn-back");
  const btnRestart   = document.getElementById("btn-restart");
  const paymentSummary = document.getElementById("payment-summary");
  const paymentError   = document.getElementById("payment-error");

  let stripe, elements, paymentElement;
  let formData = {};
  let paymentIntentId = "";

  // ── Helpers ───────────────────────────────────────────────────────────────
  function show(stepName) {
    Object.values(steps).forEach(s => s.classList.add("hidden"));
    steps[stepName].classList.remove("hidden");
  }

  function showError(msg) {
    paymentError.textContent = msg;
    paymentError.classList.remove("hidden");
  }

  function hideError() {
    paymentError.classList.add("hidden");
  }

  function collectForm() {
    const fd = new FormData(resumeForm);
    return Object.fromEntries(fd.entries());
  }

  const LABELS = {
    resume:       "Resume only — $1.99",
    cover_letter: "Cover Letter only — $1.99",
    both:         "Resume + Cover Letter — $2.99",
  };

  // ── Boot ──────────────────────────────────────────────────────────────────
  loadConfig().catch(console.error);

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
  resumeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!resumeForm.checkValidity()) {
      resumeForm.reportValidity();
      return;
    }

    formData = collectForm();
    if (!formData.doc_type) {
      alert("Please select what you need (resume, cover letter, or both).");
      return;
    }

    btnCheckout.disabled = true;
    btnCheckout.textContent = "Loading payment…";

    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: formData.doc_type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create payment");

      paymentIntentId = data.client_secret.split("_secret_")[0];
      paymentSummary.textContent = LABELS[formData.doc_type];

      // Init Stripe Elements
      stripe = Stripe(STRIPE_PK);
      elements = stripe.elements({ clientSecret: data.client_secret });
      paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");

      show("payment");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      btnCheckout.disabled = false;
      btnCheckout.textContent = "Continue to Payment →";
    }
  });

  // ── Back button ───────────────────────────────────────────────────────────
  btnBack.addEventListener("click", () => show("form"));

  // ── Step 2: Pay ───────────────────────────────────────────────────────────
  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    btnPay.disabled = true;
    btnPay.textContent = "Processing…";

    // Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      showError(error.message);
      btnPay.disabled = false;
      btnPay.textContent = "Pay & Generate PDF";
      return;
    }

    if (paymentIntent.status !== "succeeded") {
      showError("Payment not completed. Please try again.");
      btnPay.disabled = false;
      btnPay.textContent = "Pay & Generate PDF";
      return;
    }

    // ── Step 3: Generate ──────────────────────────────────────────────────
    show("processing");

    try {
      const payload = {
        ...formData,
        years_experience: parseInt(formData.years_experience, 10),
        payment_intent_id: paymentIntent.id,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Generation failed");
      }

      // Trigger PDF download
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${formData.full_name.replace(/\s+/g, "_")}_${formData.doc_type}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      show("done");
    } catch (err) {
      show("payment");
      showError("Generation error: " + err.message);
      btnPay.disabled = false;
      btnPay.textContent = "Pay & Generate PDF";
    }
  });

  // ── Restart ───────────────────────────────────────────────────────────────
  btnRestart.addEventListener("click", () => {
    resumeForm.reset();
    paymentIntentId = "";
    formData = {};
    if (paymentElement) { paymentElement.destroy(); paymentElement = null; }
    show("form");
  });
})();
