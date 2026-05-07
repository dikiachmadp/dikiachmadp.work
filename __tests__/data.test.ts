import {
  getConfig,
  getNavigation,
  getHero,
  getStats,
  getProjects,
  getServices,
  getAbout,
  getFooter,
  getFeaturedProjects,
  getProjectsByCategory,
} from "@/lib/data";

describe("data accessors", () => {
  it("returns a valid site config", () => {
    const c = getConfig();
    expect(c.siteName).toBeTruthy();
    expect(c.author).toBe("Diki Achmad Prasetya");
    expect(c.url).toMatch(/^https?:\/\//);
  });

  it("returns navigation with primary links", () => {
    const nav = getNavigation();
    expect(Array.isArray(nav.primary)).toBe(true);
    expect(nav.primary.length).toBeGreaterThan(0);
    expect(nav.primary[0]).toHaveProperty("href");
    expect(nav.primary[0]).toHaveProperty("label");
  });

  it("returns hero content with CTAs", () => {
    const hero = getHero();
    expect(hero.headline).toBeTruthy();
    expect(hero.cta.primary.href).toBeTruthy();
  });

  it("returns stat items", () => {
    const stats = getStats();
    expect(stats.items.length).toBeGreaterThanOrEqual(2);
  });

  it("returns projects and categories", () => {
    const { projects, categories } = getProjects();
    expect(projects.length).toBeGreaterThan(0);
    expect(categories).toContain("All");
  });

  it("returns only featured projects when requested", () => {
    const featured = getFeaturedProjects();
    expect(featured.every((p) => p.featured)).toBe(true);
  });

  it("filters projects by category", () => {
    const branding = getProjectsByCategory("Branding");
    expect(branding.every((p) => p.category === "Branding")).toBe(true);

    const all = getProjectsByCategory("All");
    const { projects } = getProjects();
    expect(all.length).toBe(projects.length);
  });

  it("returns services with deliverables", () => {
    const { services } = getServices();
    expect(services.length).toBeGreaterThan(0);
    expect(services[0].deliverables.length).toBeGreaterThan(0);
  });

  it("returns about content", () => {
    const about = getAbout();
    expect(about.intro.headline).toBeTruthy();
    expect(about.biography.length).toBeGreaterThan(0);
  });

  it("returns footer columns", () => {
    const footer = getFooter();
    expect(footer.columns.length).toBeGreaterThan(0);
  });
});
