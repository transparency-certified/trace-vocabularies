// Tests for TRACE project w3id.org redirect rules.
//
// Modes:
//   W3ID_MODE=local   — test against local Apache Docker (default)
//   W3ID_MODE=remote  — test against live w3id.org
//
// Local mode:  npm run docker:start && npm run test:local && npm run docker:stop
// Remote mode: npm run test:remote

const { expect } = require("chai");
const http = require("http");
const https = require("https");

const mode = process.env.W3ID_MODE || "local";

const BASE_URL =
  mode === "remote"
    ? "https://w3id.org/trace"
    : "http://localhost:8080/trace";

const PAGES_BASE = "https://transparency-certified.github.io/trace-vocabularies";

// Fetch without following redirects. Returns { status, location }.
function request(urlStr, accept) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const transport = url.protocol === "https:" ? https : http;
    const headers = {};
    if (accept) headers["Accept"] = accept;

    const req = transport.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search,
        method: "GET", headers },
      (res) => {
        res.resume(); // drain
        resolve({
          status: res.statusCode,
          location: res.headers["location"] || null,
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

describe(`w3id.org redirect tests (${mode} mode)`, function () {

  // -------------------------------------------------------------------
  // Versioned content negotiation
  // -------------------------------------------------------------------
  describe("Versioned TROV URI — content negotiation", function () {

    it("T01: Turtle request returns 303 to trov.ttl", async function () {
      const res = await request(`${BASE_URL}/trov/0.1`, "text/turtle");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/trov.ttl`);
    });

    it("T02: Turtle request with trailing slash", async function () {
      const res = await request(`${BASE_URL}/trov/0.1/`, "text/turtle");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/trov.ttl`);
    });

    it("T03: JSON-LD request returns 303 to trov.jsonld", async function () {
      const res = await request(`${BASE_URL}/trov/0.1`, "application/ld+json");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/trov.jsonld`);
    });

    it("T04: RDF/XML request returns 303 to trov.rdf", async function () {
      const res = await request(`${BASE_URL}/trov/0.1`, "application/rdf+xml");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/trov.rdf`);
    });

    it("T05: N-Triples request returns 303 to trov.nt", async function () {
      const res = await request(`${BASE_URL}/trov/0.1`, "application/n-triples");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/trov.nt`);
    });

    it("T06: Explicit text/html returns 303 to HTML page", async function () {
      const res = await request(`${BASE_URL}/trov/0.1`, "text/html");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/`);
    });

    it("T07: No Accept header defaults to HTML page", async function () {
      const res = await request(`${BASE_URL}/trov/0.1`, null);
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/`);
    });

    it("T08: Browser-style Accept header returns HTML page", async function () {
      const accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
      const res = await request(`${BASE_URL}/trov/0.1`, accept);
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/`);
    });
  });

  // -------------------------------------------------------------------
  // Wildcard version matching
  // -------------------------------------------------------------------
  describe("Wildcard version matching", function () {

    it("T09: Future version '1' works for Turtle", async function () {
      const res = await request(`${BASE_URL}/trov/1`, "text/turtle");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/1/trov.ttl`);
    });

    it("T10: Future version '0.2' works for HTML", async function () {
      const res = await request(`${BASE_URL}/trov/0.2`, "text/html");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.2/`);
    });
  });

  // -------------------------------------------------------------------
  // Context file
  // -------------------------------------------------------------------
  describe("Context file direct access", function () {

    it("T11: context.jsonld request redirects correctly", async function () {
      const res = await request(`${BASE_URL}/trov/0.1/context.jsonld`);
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/0.1/context.jsonld`);
    });
  });

  // -------------------------------------------------------------------
  // Pre-release namespace passthrough
  // -------------------------------------------------------------------
  describe("Pre-release namespace (2023/05/trov)", function () {

    it("T12: Turtle request rewrites to trov/prerelease and redirects", async function () {
      const res = await request(`${BASE_URL}/2023/05/trov`, "text/turtle");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/prerelease/trov.ttl`);
    });

    it("T13: JSON-LD request rewrites to trov/prerelease and redirects", async function () {
      const res = await request(`${BASE_URL}/2023/05/trov`, "application/ld+json");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/prerelease/trov.jsonld`);
    });

    it("T14: HTML request rewrites to trov/prerelease and redirects", async function () {
      const res = await request(`${BASE_URL}/2023/05/trov`, "text/html");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/prerelease/`);
    });

    it("T15: Trailing slash works", async function () {
      const res = await request(`${BASE_URL}/2023/05/trov/`, "text/turtle");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/prerelease/trov.ttl`);
    });

    it("T16: Context file through pre-release path", async function () {
      const res = await request(`${BASE_URL}/2023/05/trov/context.jsonld`);
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/trov/prerelease/context.jsonld`);
    });
  });

  // -------------------------------------------------------------------
  // Default fallback — browsers
  // -------------------------------------------------------------------
  describe("Default fallback — browsers get vocabulary index", function () {

    it("T17: Root with browser Accept", async function () {
      const res = await request(`${BASE_URL}/`, "text/html");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/`);
    });

    it("T18: Root with no Accept header gets 406", async function () {
      // Node's http.request sends no Accept header (unlike curl which sends */*).
      // With no header, the request doesn't match text/html or */* and falls
      // through to the 406 rule.
      const res = await request(`${BASE_URL}/`, null);
      expect(res.status).to.equal(406);
    });

    it("T19: Unversioned trov with browser Accept", async function () {
      const res = await request(`${BASE_URL}/trov`, "text/html");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/`);
    });

    it("T20: Unversioned trov with wildcard Accept", async function () {
      const res = await request(`${BASE_URL}/trov`, "*/*");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/`);
    });

    it("T21: Unknown path with browser Accept", async function () {
      const res = await request(`${BASE_URL}/bogus`, "text/html");
      expect(res.status).to.equal(303);
      expect(res.location).to.equal(`${PAGES_BASE}/`);
    });
  });

  // -------------------------------------------------------------------
  // Default fallback — RDF clients get 406
  // -------------------------------------------------------------------
  describe("Default fallback — RDF clients get 406", function () {

    it("T22: Unversioned trov with Turtle Accept", async function () {
      const res = await request(`${BASE_URL}/trov`, "text/turtle");
      expect(res.status).to.equal(406);
    });

    it("T23: Unversioned trov with JSON-LD Accept", async function () {
      const res = await request(`${BASE_URL}/trov`, "application/ld+json");
      expect(res.status).to.equal(406);
    });

    it("T24: Root with Turtle Accept", async function () {
      const res = await request(`${BASE_URL}/`, "text/turtle");
      expect(res.status).to.equal(406);
    });

    it("T25: Unknown path with RDF Accept", async function () {
      const res = await request(`${BASE_URL}/bogus`, "text/turtle");
      expect(res.status).to.equal(406);
    });
  });

  // -------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------
  describe("Edge cases", function () {

    it("T26: Versioned URI with extra path segments falls to default", async function () {
      const res = await request(`${BASE_URL}/trov/0.1/something`, "text/turtle");
      // (.+?)/?$ won't match extra segments — falls through to default
      expect(res.status).to.equal(406);
    });

    it("T27: Trailing slash on unversioned trov", async function () {
      const res = await request(`${BASE_URL}/trov/`, "text/turtle");
      expect(res.status).to.equal(406);
    });
  });
});
