/**
 * Generates a mock 32-item form (8 BN_Faithful, 8 BN_Flawed, 8 EN_Faithful, 8 EN_Flawed)
 * and mock attention check objects for pure unit testing.
 */
export function createFakeForm(formId = "Form_A") {
  const conditions = [
    { condition: "BN_Faithful", language: "Bangla", fidelity: "Faithful", ft_code: "NONE" },
    { condition: "BN_Flawed", language: "Bangla", fidelity: "Flawed", ft_code: "FT-1" },
    { condition: "EN_Faithful", language: "English", fidelity: "Faithful", ft_code: "NONE" },
    { condition: "EN_Flawed", language: "English", fidelity: "Flawed", ft_code: "FT-2" },
  ];

  const items = [];
  let itemIdCounter = 1;

  for (const cond of conditions) {
    for (let index = 1; index <= 8; index++) {
      const isFaithful = cond.fidelity === "Faithful";
      const groundTruth = `Correct Answer ${itemIdCounter}`;
      const aiAnswer = isFaithful ? groundTruth : `Wrong Answer ${itemIdCounter}`;

      items.push({
        form_id: formId,
        item_id: itemIdCounter,
        condition: cond.condition,
        language: cond.language,
        fidelity: cond.fidelity,
        ft_code: cond.ft_code,
        riddle_text: `Riddle question ${itemIdCounter}?`,
        mcq_options: [
          groundTruth,
          `Distractor A ${itemIdCounter}`,
          `Distractor B ${itemIdCounter}`,
          `Distractor C ${itemIdCounter}`,
        ],
        cot_text: "1. Step one\n2. Step two\n3. Step three\n4. Conclusion",
        ai_predicted_answer: aiAnswer,
        ground_truth_answer: groundTruth,
      });

      itemIdCounter++;
    }
  }

  const attentionChecks = {
    bangla: {
      item_id: -1,
      language: "Bangla",
      riddle_text: "বাংলা মনোযোগ ধাঁধা?",
      cot_text: "১. ধাপ\n২. ধাপ\n৩. ধাপ\n৪. মনোযোগ যাচাই: আপনি যদি মনোযোগ দিয়ে পড়ে থাকেন, তবে নিচের অপশন থেকে 'নীল হাতি' নির্বাচন করুন এবং বিশ্বাসের স্কোর ১ দিন।",
      mcq_options: ["লাল ঘোড়া", "সবুজ বাঘ", "নীল হাতি", "হলুদ পাখি"],
      expected_answer: "নীল হাতি",
      ai_predicted_answer: "নীল হাতি",
      expected_trust: 1,
    },
    english: {
      item_id: -2,
      language: "English",
      riddle_text: "English attention riddle?",
      cot_text: "1. Step\n2. Step\n3. Step\n4. Attention Check: If you are reading carefully, select 'Blue Elephant' as your answer below and set your trust rating to 1.",
      mcq_options: ["Red Horse", "Green Tiger", "Blue Elephant", "Yellow Bird"],
      expected_answer: "Blue Elephant",
      ai_predicted_answer: "Blue Elephant",
      expected_trust: 1,
    },
  };

  return { items, attentionChecks };
}
