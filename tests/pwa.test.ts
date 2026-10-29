import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest & Configuration', () => {
  const rootDir = path.resolve(__dirname, '..');
  const manifestPath = path.join(rootDir, 'public', 'manifest.json');
  const swPath = path.join(rootDir, 'public', 'sw.js');
  const appleIconPath = path.join(rootDir, 'public', 'apple-touch-icon.png');

  it('should have a valid public/manifest.json', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    expect(manifest.name).toBe('N5Exam - Nền tảng Khảo thí & Luyện thi Trực tuyến');
    expect(manifest.short_name).toBe('N5Exam');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBe('#4f46e5');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('should verify that all declared PWA icons exist on disk', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const icon of manifest.icons) {
      // Remove leading slash
      const relativePath = icon.src.startsWith('/') ? icon.src.slice(1) : icon.src;
      const iconFilePath = path.join(rootDir, 'public', relativePath);
      expect(fs.existsSync(iconFilePath)).toBe(true);
      const stat = fs.statSync(iconFilePath);
      expect(stat.size).toBeGreaterThan(100); // Must be a valid non-empty file
    }
  });

  it('should have an apple-touch-icon for iOS Safari', () => {
    expect(fs.existsSync(appleIconPath)).toBe(true);
    const stat = fs.statSync(appleIconPath);
    expect(stat.size).toBeGreaterThan(100);
  });

  it('should have a valid Service Worker file', () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, 'utf8');
    expect(swContent).toContain("addEventListener('install'");
    expect(swContent).toContain("addEventListener('activate'");
    expect(swContent).toContain("addEventListener('fetch'");
  });
});
