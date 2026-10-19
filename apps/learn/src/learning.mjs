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
  ,
  {
    id: "observe-queue-02",
    lessonId: "observation-foundations",
    faculty: "Human intelligence",
    title: "The disappearing queue",
    subtitle: "Distinguish a pattern from its cause.",
    setup: "A queue at a counter grows between noon and 12:30. After a new sign is placed near the entrance, the queue appears shorter.",
    prompt: "What do you know? Did the sign shorten the queue, or could something else explain the change?",
    hint: "Compare customer arrivals, service times and the same half-hour on other days before deciding what caused the change.",
    reflection: "A shorter observed queue does not prove the sign worked. Customer demand, staffing, order complexity or people leaving without buying may have changed. Measure arrivals, wait time and completed orders, then compare with a relevant baseline.",
    nextStep: "Which measurements could reveal that the shorter queue actually meant lost sales?",
    emoji: "◌"
  },
  {
    id: "observe-message-03",
    lessonId: "observation-foundations",
    faculty: "Human intelligence",
    title: "The unread message",
    subtitle: "Question the story your mind invents.",
    setup: "You send a colleague an important message. The status says it was delivered, but the colleague has not replied by evening.",
    prompt: "Which facts are observable? List at least two explanations and one respectful way to obtain better information.",
    hint: "Delivered is not the same as read, understood or deliberately ignored.",
    reflection: "The evidence supports only that delivery was reported and no reply arrived. The recipient might be busy, offline, unsure how to respond or waiting for information. A concise follow-up through an agreed channel can reduce uncertainty.",
    nextStep: "How would a known deadline change the appropriate follow-up?",
    emoji: "⌁"
  },
  {
    id: "finance-discount-02",
    lessonId: "finance-reasoning",
    faculty: "Financial intelligence",
    title: "The discount that sells",
    subtitle: "Sales volume is not the same as contribution.",
    setup: "A meal sells for RM20 and costs RM12 in variable ingredients and packaging. Marketing suggests a 25% discount to double sales.",
    prompt: "What happens to contribution per meal before considering rent, wages and advertising? What else must you know?",
    hint: "Compare RM20 − RM12 with RM15 − RM12. More orders also use capacity and may create additional costs.",
    reflection: "Contribution per meal falls from RM8 to RM3. If volume truly doubles, two discounted meals contribute RM6 versus RM8 from one full-priced meal, before new costs. The promotion could still serve a strategic purpose, but revenue growth alone does not justify it.",
    nextStep: "How many discounted meals would replace the RM8 contribution of one full-priced meal?",
    emoji: "↘"
  },
  {
    id: "finance-stock-03",
    lessonId: "finance-reasoning",
    faculty: "Financial intelligence",
    title: "The shelf full of profit",
    subtitle: "Understand the hidden cost of inventory.",
    setup: "A retailer buys RM40,000 of stock before a seasonal sale. Half the stock remains unsold and the supplier invoice is due next week.",
    prompt: "Why might a busy sales week still create a cash problem? What decisions depend on sell-through and payment timing?",
    hint: "Separate when goods are bought, when customers pay and when suppliers must be paid.",
    reflection: "Cash leaves or becomes payable before all inventory turns into sales. Unsold items tie up working capital and can face markdown or spoilage risk. A sensible review connects sell-through, gross margin, cash receipts and supplier terms.",
    nextStep: "Which trade-off changes if the supplier offers a longer payment term?",
    emoji: "▤"
  },
  {
    id: "design-phone-02",
    lessonId: "design-reasoning",
    faculty: "Design and systems intelligence",
    title: "Too many taps",
    subtitle: "Design for real work, not a pretty screenshot.",
    setup: "During a rush, a staff member needs seven taps and three screen changes to add one common item to an order on a small phone.",
    prompt: "How would you redesign this flow without hiding important choices or making mistakes more likely?",
    hint: "Measure task time, wrong selections, thumb reach and what the user needs most often.",
    reflection: "Fewer taps may help, but accuracy and recoverability also matter. Test prominent frequent items, larger touch targets, a visible cart and minimal mode switches. Compare real task completion times and errors with frontline users before declaring the redesign better.",
    nextStep: "What should happen if the staff member taps the wrong item halfway through a rush?",
    emoji: "▣"
  },
  {
    id: "design-rain-03",
    lessonId: "design-reasoning",
    faculty: "Design and systems intelligence",
    title: "The shelter that floods",
    subtitle: "Look at the whole system and its constraints.",
    setup: "A roadside shelter keeps rain off waiting passengers, but water now drains onto the walkway used by wheelchair users and pedestrians.",
    prompt: "Is the shelter a successful design? Whose needs and which operating conditions have been missed?",
    hint: "Consider drainage, access, visibility, maintenance and the real route through the site.",
    reflection: "Protecting seated passengers solves one problem while transferring another to the walkway. Design quality must include safe access, drainage paths, usability in heavy rain and maintenance. Evaluate the full site and its users rather than a single sheltered spot.",
    nextStep: "What on-site test during rainfall would challenge your preferred solution?",
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
