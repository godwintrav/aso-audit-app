import { Injectable } from "@nestjs/common";
import type { Review } from "@aso/schemas";

export interface CompetitorCandidate {
  appId: string;
  title: string;
}

export interface ParsedAppStorePage {
  subtitle?: string;
  reviews: Review[];
  whatsNew?: string;
  privacy?: string;
  accessibility?: string;
  competitorCandidates: CompetitorCandidate[];
}


@Injectable()
export class AppStorePageParser {
  parse(markdown: string): ParsedAppStorePage {
    return {
      subtitle: this.extractSubtitle(markdown),
      reviews: this.extractReviews(markdown),
      whatsNew: this.extractWhatsNew(markdown),
      privacy: this.extractSection(markdown, /App Privacy/, /Accessibility|Information/),
      accessibility: this.extractSection(markdown, /Accessibility/, /Information|Copyright/),
      competitorCandidates: this.extractCompetitors(markdown),
    };
  }

  private extractSubtitle(markdown: string): string | undefined {
    const lines = markdown.split("\n");
    const titleIdx = lines.findIndex((l) => /^#\s+\S/.test(l));
    if (titleIdx === -1) return undefined;

    for (let i = titleIdx + 1; i < Math.min(titleIdx + 6, lines.length); i++) {
      const line = lines[i]?.trim() ?? "";
      if (!line) continue;
      if (line.startsWith("![")) continue;
      if (line.includes("·")) continue;
      if (/^(free|£|\$|€)/i.test(line)) continue;
      if (line.startsWith("#")) break;
      return line.replace(/[*_`]/g, "").trim();
    }
    return undefined;
  }

  private extractReviews(markdown: string): Review[] {
    const section = this.sliceBetween(markdown, /Ratings & Reviews/, /What.s New/);
    if (!section) return [];

    const lines = section.split("\n");
    const reviews: Review[] = [];
    for (let i = 0; i < lines.length; i++) {
      const heading = lines[i]?.match(/^#\s+(.+)$/);
      if (!heading) continue;
      const title = heading[1]?.trim();
      if (!title || /^\d+(\.\d+)?$/.test(title)) continue;

      for (let j = i + 1; j < lines.length; j++) {
        const body = lines[j]?.trim() ?? "";
        if (!body) continue;
        if (body.startsWith("#")) break;
        reviews.push({ title, body });
        break;
      }
    }
    return reviews;
  }

  private extractWhatsNew(markdown: string): string | undefined {
    const section = this.sliceBetween(markdown, /What.s New/, /App Privacy/);
    if (!section) return undefined;
    for (const raw of section.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("#")) continue;
      if (/^[-*]?\s*\d+\.\d/.test(line)) continue;
      if (line.startsWith("-")) return line.replace(/^[-*]\s*/, "").trim();
      return line;
    }
    return undefined;
  }

  private extractCompetitors(markdown: string): CompetitorCandidate[] {
    const idx = markdown.search(/You Might Also Like/);
    if (idx === -1) return [];
    const headingEnd = markdown.indexOf("\n", idx);
    const section = markdown.slice(headingEnd === -1 ? idx : headingEnd);

    const candidates: CompetitorCandidate[] = [];
    const seen = new Set<string>();
    const re = /\*\*([^*]+)\*\*[\s\S]*?\/id(\d+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(section)) !== null) {
      const title = match[1]?.trim();
      const appId = match[2];
      if (!title || !appId || seen.has(appId)) continue;
      seen.add(appId);
      candidates.push({ title, appId });
    }
    return candidates;
  }

  private extractSection(
    markdown: string,
    start: RegExp,
    end: RegExp,
  ): string | undefined {
    const section = this.sliceBetween(markdown, start, end);
    if (!section) return undefined;
    const text = section
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && !l.startsWith("!["))
      .join(" ")
      .trim();
    return text || undefined;
  }

  private sliceBetween(
    markdown: string,
    start: RegExp,
    end: RegExp,
  ): string | undefined {
    const startMatch = markdown.match(start);
    if (!startMatch || startMatch.index === undefined) return undefined;
    const from = startMatch.index + startMatch[0].length;
    const rest = markdown.slice(from);
    const endMatch = rest.match(end);
    const to = endMatch?.index ?? rest.length;
    return rest.slice(0, to);
  }
}
