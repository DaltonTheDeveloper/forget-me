/**
 * Jurisdiction-aware deletion-request email templates.
 * Returns the subject + body for a given regulation, with the user's details filled in.
 */
import {
  JURISDICTION_REGULATION,
  type Jurisdiction,
  type Regulation,
} from "@forget-me/shared";

export interface TemplateInput {
  userEmail: string;
  service: string;
  requestId: string;
  date: string; // ISO date
  jurisdiction: Jurisdiction;
}

export interface RenderedEmail {
  regulation: Regulation;
  subject: string;
  body: string;
}

export function renderDeletionEmail(input: TemplateInput): RenderedEmail {
  const regulation = JURISDICTION_REGULATION[input.jurisdiction];
  const { userEmail, service, requestId, date } = input;

  switch (regulation) {
    case "GDPR":
      return {
        regulation,
        subject: `GDPR Article 17 — Right to Erasure Request (${service})`,
        body: `Dear Data Protection Officer,

I am writing to formally request the erasure of all personal data you hold about me, in accordance with Article 17 of the General Data Protection Regulation (GDPR).

Account email: ${userEmail}
Service: ${service}
Request ID: ${requestId}
Date: ${date}
Jurisdiction: European Union

Please confirm receipt of this request and complete the erasure within one month as required by Article 12(3). If you require anything to verify my identity, contact me at this email address.

Kind regards,
${userEmail}`,
      };
    case "CCPA":
      return {
        regulation,
        subject: `CCPA Request to Delete Personal Information (${service})`,
        body: `Dear Privacy Team,

I am a California resident exercising my right to delete personal information under the California Consumer Privacy Act (Cal. Civ. Code §1798.105).

Account email: ${userEmail}
Service: ${service}
Request ID: ${requestId}
Date: ${date}

Please delete all personal information you have collected about me and direct your service providers to do the same. Please confirm completion within 45 days as required by §1798.130.

Sincerely,
${userEmail}`,
      };
    case "LGPD":
      return {
        regulation,
        subject: `LGPD — Solicitação de Eliminação de Dados Pessoais (${service})`,
        body: `Prezada equipe de privacidade,

Solicito formalmente a eliminação de todos os meus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018), art. 18, VI.

E-mail da conta: ${userEmail}
Serviço: ${service}
ID da solicitação: ${requestId}
Data: ${date}

Peço a confirmação do recebimento e a conclusão da eliminação dentro do prazo legal.

Atenciosamente,
${userEmail}`,
      };
    case "PIPEDA":
      return {
        regulation,
        subject: `PIPEDA — Request to Delete Personal Information (${service})`,
        body: `Dear Privacy Officer,

Under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA), I request that you delete the personal information you hold about me, as it is no longer required for the purpose it was collected.

Account email: ${userEmail}
Service: ${service}
Request ID: ${requestId}
Date: ${date}

Please confirm receipt and the action taken in a timely manner.

Regards,
${userEmail}`,
      };
    default:
      return {
        regulation,
        subject: `Personal Data Deletion Request (${service})`,
        body: `Dear Privacy Team,

I request that you delete all personal data you hold about me associated with the account below, in accordance with applicable data protection laws in my jurisdiction.

Account email: ${userEmail}
Service: ${service}
Request ID: ${requestId}
Date: ${date}

Please confirm receipt and completion of this request.

Regards,
${userEmail}`,
      };
  }
}
