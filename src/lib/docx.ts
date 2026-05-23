import { Document, Packer, Paragraph, TextRun } from "docx";

export async function buildProjectDocx(params: {
  title: string;
  idea: string;
  questions: string[];
  answers: string[];
  summary: string;
}) {
  const { title, idea, questions, answers, summary } = params;

  const qaParagraphs = questions.flatMap((question, index) => {
    const answer = answers[index] || "Non fournie";
    return [
      new Paragraph({
        children: [new TextRun({ text: `Q${index + 1}. ${question}`, bold: true })],
        spacing: { before: 220, after: 80 },
      }),
      new Paragraph({
        text: answer,
        spacing: { after: 120 },
      }),
    ];
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "PEAK-A - Document de cadrage", bold: true, size: 34 })],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Projet: ${title}`, bold: true })],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Idée initiale", bold: true })],
            spacing: { before: 160, after: 80 },
          }),
          new Paragraph({ text: idea }),
          new Paragraph({
            children: [new TextRun({ text: "Questions de cadrage", bold: true })],
            spacing: { before: 260, after: 80 },
          }),
          ...qaParagraphs,
          new Paragraph({
            children: [new TextRun({ text: "Bilan", bold: true })],
            spacing: { before: 260, after: 80 },
          }),
          ...summary.split("\n").map((line) => new Paragraph({ text: line || " " })),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function buildChatDocx(params: {
  title: string;
  turns: { role: string; content: string }[];
}) {
  const { title, turns } = params;

  const children = [
    new Paragraph({
      children: [new TextRun({ text: "PEAK-A - Conversation avec l'agent", bold: true, size: 34 })],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Projet: ${title}`, bold: true })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "Transcription du dialogue (tel qu'enregistré).",
      spacing: { after: 200 },
    }),
  ];

  for (const turn of turns) {
    const label = turn.role === "user" ? "Toi" : "PEAK-A";
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${label}`, bold: true })],
        spacing: { before: 200, after: 80 },
      }),
    );
    for (const line of turn.content.split("\n")) {
      children.push(new Paragraph({ text: line || " " }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
