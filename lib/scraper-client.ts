import type { MovieJSON, ScraperTriggerPayload } from "@/types/scraper.types";

const DEFAULT_AGENT_URL = "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT_MS = 60_000;

function getAgentUrl() {
  return (process.env.PYTHON_AGENT_URL || DEFAULT_AGENT_URL).replace(/\/$/, "");
}

async function parseJsonOrText(response: Response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractErrorMessage(payload: any, fallback: string) {
  const detail = payload?.detail ?? payload?.error ?? payload;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail?.message && detail?.details) {
    return `${detail.message} ${detail.details}`.trim();
  }

  if (detail?.message) {
    return detail.message;
  }

  if (payload?.message) {
    return payload.message;
  }

  return fallback;
}

async function requestMovieScrape(payload: ScraperTriggerPayload): Promise<MovieJSON> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const url = `${getAgentUrl()}/scrape/movie`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: payload.query,
        region: payload.region.toUpperCase(),
        sources: payload.sources,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await parseJsonOrText(response);

    if (!response.ok) {
      const message = extractErrorMessage(data, `Python scraper returned HTTP ${response.status}`);
      const error = new Error(message) as Error & { status?: number; data?: unknown };
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data as MovieJSON;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Python scraper request timed out after 60 seconds. Check the FastAPI terminal for details.");
    }

    if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
      throw new Error(
        `Could not reach the Python scraper at ${url}. Make sure uvicorn is running on port 8000 and PYTHON_AGENT_URL is correct.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Keep the original Phase 2 API name. app/api/scraper/trigger/route.ts imports this.
export async function scrapeMovie(input: ScraperTriggerPayload): Promise<MovieJSON> {
  return requestMovieScrape(input);
}

// Keep the newer helper name too, so both old and new route code work.
export async function triggerPythonScraper(payload: ScraperTriggerPayload): Promise<MovieJSON> {
  return requestMovieScrape(payload);
}
