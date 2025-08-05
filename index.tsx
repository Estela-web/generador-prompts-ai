/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Eres un asistente experto en prompting estratégico para pymes y retailers. Tu objetivo es generar prompts listos para usar que sean altamente efectivos, aplicando las mejores técnicas (One-Shot, Chain of Thought, EGI, DRCA, Autodiagnóstico, Ingeniería Inversa y Sintaxis de Precisión). Personaliza los prompts según el área del negocio, el reto y el tipo de empresa. Sé claro, directo y estratégico. Evita tecnicismos innecesarios. El resultado debe ser un prompt potente, editable y accionable.`;

const promptTemplate = (area_de_negocio, reto, tipo_de_pyme, tecnica_prompting, tono) => `
Actúa como un generador experto en prompts para negocios del tipo ${tipo_de_pyme}. Aplica la técnica ${tecnica_prompting} para ayudar en el área de ${area_de_negocio} con el siguiente reto: "${reto}".

Tu tarea es crear un prompt altamente personalizado, directo y accionable, que use un tono ${tono}. El prompt debe estar listo para ser usado en herramientas de IA como ChatGPT.

Prompt generado:
---
`;

document.addEventListener('DOMContentLoaded', () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        console.warn("API_KEY environment variable not set.");
    }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const form = document.getElementById('prompt-form') as HTMLFormElement;
    const generateButton = document.getElementById('generate-button') as HTMLButtonElement;
    const promptOutput = document.getElementById('prompt-output') as HTMLElement;
    const copyButton = document.getElementById('copy-button') as HTMLButtonElement;
    const errorContainer = document.getElementById('error-container') as HTMLElement;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (generateButton.disabled) return;

        generateButton.disabled = true;
        promptOutput.textContent = 'Generando...';
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';

        const formData = new FormData(form);
        const area_de_negocio = formData.get('area_de_negocio') as string;
        const reto = formData.get('reto') as string;
        const tipo_de_pyme = formData.get('tipo_de_pyme') as string;
        const tecnica_prompting = formData.get('tecnica_prompting') as string;
        const tono = formData.get('tono') as string;

        const userMessage = promptTemplate(area_de_negocio, reto, tipo_de_pyme, tecnica_prompting, tono);

        try {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                config: {
                    systemInstruction: systemInstruction
                }
            });

            let fullResponse = '';
            promptOutput.textContent = '';

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponse += chunkText;
                    promptOutput.textContent = fullResponse;
                }
            }

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            errorContainer.textContent = `Error: ${errorMessage}`;
            errorContainer.style.display = 'block';
            promptOutput.textContent = 'Hubo un error al generar el prompt.';
        } finally {
            generateButton.disabled = false;
        }
    });

    copyButton.addEventListener('click', async () => {
        const textToCopy = promptOutput.textContent;
        if (!textToCopy || textToCopy === 'El prompt generado aparecerá aquí. Completa el formulario y haz clic en "Generar Prompt" para comenzar.') {
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalText = copyButton.querySelector('span').textContent;
            copyButton.querySelector('span').textContent = '¡Copiado!';
            setTimeout(() => {
                copyButton.querySelector('span').textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });
});

