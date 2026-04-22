export async function askDiseaseQuestion(disease, question) {
  const response = await fetch("http://127.0.0.1:8000/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      disease,
      question,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get AI answer");
  }

  return await response.json();
}