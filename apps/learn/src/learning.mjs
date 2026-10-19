// Only free-preview scenarios belong in public catalog data.
// Never expose future paid lesson bodies through this endpoint.
export const scenarios = Object.freeze([
  {
    id: "observe-cafe-01",
    lessonId: "observation-foundations",
    faculty: "Human intelligence",
    title: "The quiet customer",
    subtitle: "Separate observation from interpretation.",
    setup: "A customer checks his phone three times, barely touches his coffee, watches the entrance, says everything is fine, then leaves suddenly.",
    prompt: "What might explain his behaviour? What do you actually know, and what must remain uncertain?",
    reflection: "Observations: he checked his phone, looked at the entrance and left. An appointment, a wrong café or anxiety are hypotheses—not established facts. Which observation would discriminate between them?",
    nextStep: "Ask what evidence would change your interpretation.",
    emoji: "◎"
  },
  {
    id: "finance-cash-01",
    lessonId: "finance-reasoning",
    faculty: "Financial intelligence",
    title: "Profit without cash",
    subtitle: "Distinguish reported profit and available cash.",
    setup: "A business reports RM100,000 revenue, RM70,000 expenses and RM0 bank cash, then requests a RM50,000 loan.",
    prompt: "Does this prove profitability or creditworthiness? What records would you inspect before lending?",
    reflection: "RM30,000 is the stated revenue-minus-expenses difference, not verified profit or liquidity. Check the accounting basis, receivables, payables, cash flows, debt maturities and repayment capacity.",
    nextStep: "Consider how unpaid invoices change the assessment.",
    emoji: "↗"
  },
  {
    id: "design-bridge-01",
    lessonId: "design-reasoning",
    faculty: "Design and systems intelligence",
    title: "The bridge design",
    subtitle: "Explain the reason behind a design decision.",
    setup: "Two footbridges carry the same number of pedestrians. One has a longer unsupported span and experiences greater deflection.",
    prompt: "What factors might explain the difference? What must you measure before declaring one design unsafe?",
    reflection: "Span, geometry, material stiffness, support conditions, load distribution and serviceability limits can all matter. Greater deflection alone does not establish failure without applicable design criteria.",
    nextStep: "What changes when the same bridge faces repeated dynamic loads?",
    emoji: "◇"
  }
]);
export function publicCatalog() {
  return {
    product: "MARIZ Learn",
    philosophy: "Understand why. Learn without fear.",
    mode: "preview",
    faculties: ["Human intelligence", "Financial intelligence", "Design and systems intelligence"],
    scenarios
  };
}
export function findScenario(id) {
  return scenarios.find((entry) => entry.id === id) ?? null;
}
