(() => {
  // ── i18n ──────────────────────────────────────────────────────────────────
  const STRINGS = {
    it: {
      tagline:           "Ottieni un CV e una lettera di presentazione personalizzati e ottimizzati per gli ATS in pochi secondi — powered by Claude AI.",
      legend_details:    "I tuoi dati",
      label_name:        "Nome e cognome *",
      ph_name:           "Mario Rossi",
      label_email:       "Email *",
      ph_email:          "mario@esempio.it",
      label_phone:       "Telefono *",
      ph_phone:          "+39 333 000 0000",
      label_title:       "Ruolo attuale / più recente *",
      ph_title:          "Sviluppatore Software",
      label_years:       "Anni di esperienza *",
      ph_years:          "5",
      label_skills:      "Competenze chiave *",
      hint_skills:       "(separate da virgola)",
      ph_skills:         "Python, React, SQL, leadership",
      label_history:     "Riepilogo esperienze lavorative *",
      ph_history:        "Descrivi brevemente i tuoi ruoli e risultati: nomi aziende, responsabilità, traguardi…",
      legend_role:       "Ruolo target",
      label_target:      "Titolo del ruolo desiderato *",
      ph_target:         "Senior Product Manager",
      label_jd:          "Descrizione del lavoro *",
      hint_jd:           "(incolla l'annuncio completo)",
      ph_jd:             "Siamo alla ricerca di…",
      legend_doctype:    "Di cosa hai bisogno?",
      opt_resume:        "Solo CV",
      opt_cover:         "Solo Lettera di Presentazione",
      opt_both:          "CV + Lettera di Presentazione",
      price_resume:      "€1,99",
      price_cover:       "€1,99",
      price_both:        "€2,99",
      btn_checkout:      "Continua al Pagamento →",
      btn_checkout_load: "Caricamento pagamento…",
      step2_title:       "Completa il pagamento",
      btn_pay:           "Paga e Genera PDF",
      btn_pay_proc:      "Elaborazione…",
      btn_back:          "← Indietro",
      step3_msg:         "Sto generando i tuoi documenti con Claude AI…",
      step4_title:       "I tuoi documenti sono pronti!",
      step4_msg:         "Il PDF si sta scaricando automaticamente.",
      btn_restart:       "Genera un altro →",
      err_doctype:       "Seleziona cosa ti serve (CV, lettera di presentazione o entrambi).",
      err_payment:       "Pagamento non completato. Riprova.",
      err_gen:           "Errore di generazione: ",
      label_resume_only:  "Solo CV — €1,99",
      label_cover_only:   "Solo Lettera — €1,99",
      label_both:         "CV + Lettera — €2,99",
    },
    en: {
      tagline:           "Get a tailored, ATS-optimized resume and cover letter in seconds — powered by Claude AI.",
      legend_details:    "Your Details",
      label_name:        "Full Name *",
      ph_name:           "Jane Doe",
      label_email:       "Email *",
      ph_email:          "jane@example.com",
      label_phone:       "Phone *",
      ph_phone:          "+1 555 000 0000",
      label_title:       "Current / Most Recent Title *",
      ph_title:          "Software Engineer",
      label_years:       "Years of Experience *",
      ph_years:          "5",
      label_skills:      "Key Skills *",
      hint_skills:       "(comma-separated)",
      ph_skills:         "Python, React, SQL, leadership",
      label_history:     "Work History Summary *",
      ph_history:        "Briefly describe your roles and achievements: company names, responsibilities, key wins…",
      legend_role:       "Target Role",
      label_target:      "Target Job Title *",
      ph_target:         "Senior Product Manager",
      label_jd:          "Job Description *",
      hint_jd:           "(paste the full job posting)",
      ph_jd:             "We are looking for a…",
      legend_doctype:    "What do you need?",
      opt_resume:        "Resume only",
      opt_cover:         "Cover Letter only",
      opt_both:          "Resume + Cover Letter",
      price_resume:      "$1.99",
      price_cover:       "$1.99",
      price_both:        "$2.99",
      btn_checkout:      "Continue to Payment →",
      btn_checkout_load: "Loading payment…",
      step2_title:       "Complete Payment",
      btn_pay:           "Pay & Generate PDF",
      btn_pay_proc:      "Processing…",
      btn_back:          "← Back",
      step3_msg:         "Generating your documents with Claude AI…",
      step4_title:       "Your documents are ready!",
      step4_msg:         "Your PDF is downloading automatically.",
      btn_restart:       "Generate another →",
      err_doctype:       "Please select what you need (resume, cover letter, or both).",
      err_payment:       "Payment not completed. Please try again.",
      err_gen:           "Generation error: ",
      label_resume_only:  "Resume only — $1.99",
      label_cover_only:   "Cover Letter only — $1.99",
      label_both:         "Resume + Cover Letter — $2.99",
    },
  };

  let lang = "it"; // default language

  function t(key) { return STRINGS[lang][key] || key; }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = t(key);
      } else {
        el.textContent = t(key);
      }
    });
    document.querySelectorAll("[data-i18n-hint]").forEach(el => {
      el.textContent = t(el.dataset.i18nHint);
    });
    // Update toggle button state
    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
  }

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
  const step3Msg       = document.getElementById("step3-msg");
  const step4Title     = document.getElementById("step4-title");
  const step4Msg       = document.getElementById("step4-msg");

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

  // ── Language toggle ───────────────────────────────────────────────────────
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      lang = btn.dataset.lang;
      applyTranslations();
      // Sync dynamic button text
      btnCheckout.textContent = t("btn_checkout");
      btnPay.textContent      = t("btn_pay");
      btnBack.textContent     = t("btn_back");
      btnRestart.textContent  = t("btn_restart");
    });
  });

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
  resumeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!resumeForm.checkValidity()) {
      resumeForm.reportValidity();
      return;
    }

    formData = collectForm();
    if (!formData.doc_type) {
      alert(t("err_doctype"));
      return;
    }

    btnCheckout.disabled    = true;
    btnCheckout.textContent = t("btn_checkout_load");

    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: formData.doc_type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create payment");

      paymentIntentId = data.client_secret.split("_secret_")[0];
      const LABELS = {
        resume:       t("label_resume_only"),
        cover_letter: t("label_cover_only"),
        both:         t("label_both"),
      };
      paymentSummary.textContent = LABELS[formData.doc_type];

      // Init Stripe Elements
      stripe = Stripe(STRIPE_PK);
      elements = stripe.elements({ clientSecret: data.client_secret });
      paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");

      document.getElementById("step2-title").textContent = t("step2_title");
      btnPay.textContent  = t("btn_pay");
      btnBack.textContent = t("btn_back");

      show("payment");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      btnCheckout.disabled    = false;
      btnCheckout.textContent = t("btn_checkout");
    }
  });

  // ── Back button ───────────────────────────────────────────────────────────
  btnBack.addEventListener("click", () => show("form"));

  // ── Step 2: Pay ───────────────────────────────────────────────────────────
  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    btnPay.disabled    = true;
    btnPay.textContent = t("btn_pay_proc");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      showError(error.message);
      btnPay.disabled    = false;
      btnPay.textContent = t("btn_pay");
      return;
    }

    if (paymentIntent.status !== "succeeded") {
      showError(t("err_payment"));
      btnPay.disabled    = false;
      btnPay.textContent = t("btn_pay");
      return;
    }

    // ── Step 3: Generate ──────────────────────────────────────────────────
    step3Msg.textContent = t("step3_msg");
    show("processing");

    try {
      const payload = {
        ...formData,
        years_experience: parseInt(formData.years_experience, 10),
        payment_intent_id: paymentIntent.id,
        language: lang,
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

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${formData.full_name.replace(/\s+/g, "_")}_${formData.doc_type}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      step4Title.textContent   = t("step4_title");
      step4Msg.textContent     = t("step4_msg");
      btnRestart.textContent   = t("btn_restart");
      show("done");
    } catch (err) {
      show("payment");
      showError(t("err_gen") + err.message);
      btnPay.disabled    = false;
      btnPay.textContent = t("btn_pay");
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

  // ── Boot ──────────────────────────────────────────────────────────────────
  loadConfig().catch(console.error);
  applyTranslations();
})();
