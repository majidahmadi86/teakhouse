"use client";

import { FormEvent, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { useI18n } from "@/lib/i18n";

export default function ContactPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setToast(true);
    setName("");
    setEmail("");
    setMessage("");
    window.setTimeout(() => setToast(false), 4000);
  }

  return (
    <>
      <PageHero
        image="/images/contact-hero.jpg"
        imageAvif="/images/contact-hero.avif"
        imageWebp="/images/contact-hero.webp"
        alt="Contact the house"
        eyebrow={t("ct.page")}
        title={t("ct.page")}
        lead={t("ct.lead")}
        objectPosition="center 38%"
      />

      <section className="section-pad bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-2">
          <Reveal>
            <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-line bg-cloud p-6 md:p-8">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-ink">
                  {t("ct.name")}
                </label>
                <input
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("ct.name")}
                  className="w-full px-4 py-3"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-ink">
                  {t("ct.email")}
                </label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-4 py-3"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-ink">
                  {t("ct.message")}
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("ct.message")}
                  className="w-full px-4 py-3"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                {t("ct.send")}
              </button>
              {toast ? (
                <p className="rounded-xl bg-deal-bg px-4 py-3 text-sm font-semibold text-deal">
                  {t("ct.success")}
                </p>
              ) : null}
            </form>
          </Reveal>

          <Reveal delay={0.1} className="space-y-6">
            <div className="rounded-card border border-line bg-white p-6 shadow-card">
              <p className="text-sm font-semibold text-ink">{t("ct.address")}</p>
              <a href="tel:+6620000000" className="mt-3 block text-sm font-bold text-blue">
                {t("ct.phone")}
              </a>
              <a
                href="mailto:stay@teakhouse.demo"
                className="mt-2 block text-sm font-bold text-blue"
              >
                {t("ct.mail")}
              </a>
              <p className="mt-2 text-sm font-semibold text-sub">{t("ct.line")}</p>
            </div>
            <div className="overflow-hidden rounded-card border border-line shadow-card">
              <iframe
                title="Map"
                src="https://maps.google.com/maps?q=Charoen%20Krung%2044%20Bangkok&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
