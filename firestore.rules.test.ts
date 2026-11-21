import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/**
 * Rule-structure verification harness validating that all Dirty Dozen attack vectors
 * defined in security_spec.md are explicitly guarded in firestore.rules.
 */
describe('Firestore Security Rules — Dirty Dozen Guard Verification', () => {
  const rules = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

  it('enforces rules_version = 2 and global default-deny catch-all', () => {
    assert.match(rules, /rules_version\s*=\s*'2';/);
    assert.match(rules, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  });

  it('enforces verified email check in isAdmin()', () => {
    assert.match(rules, /request\.auth\.token\.email_verified == true/);
    assert.match(rules, /request\.auth\.token\.email == 'eddykoby64@gmail\.com'/);
  });

  it('blocks client writes to /admins', () => {
    assert.match(rules, /match \/admins\/\{adminId\}[\s\S]*allow create, update, delete: if false;/);
  });

  it('guards every document write with isValidId and isValid[Entity]', () => {
    assert.match(rules, /function isValidId\(id\)/);
    assert.match(rules, /function isValidProject\(data\)/);
    assert.match(rules, /function isValidTestimonial\(data\)/);
    assert.match(rules, /function isValidSiteSettings\(data\)/);
    assert.match(rules, /function isValidInquiry\(data\)/);
  });

  it('restricts inquiries PII reads and deletes strictly to isAdmin()', () => {
    assert.match(rules, /match \/inquiries\/\{inquiryId\}[\s\S]*allow get: if isAdmin\(\) && isValidId\(inquiryId\);/);
    assert.match(rules, /match \/inquiries\/\{inquiryId\}[\s\S]*allow list: if isAdmin\(\);/);
    assert.match(rules, /match \/inquiries\/\{inquiryId\}[\s\S]*allow update: if false;/);
    assert.match(rules, /match \/inquiries\/\{inquiryId\}[\s\S]*allow delete: if isAdmin\(\) && isValidId\(inquiryId\);/);
  });

  it('enforces server timestamps and immutable createdAt/id', () => {
    assert.match(rules, /incoming\(\)\.createdAt == request\.time/);
    assert.match(rules, /incoming\(\)\.updatedAt == request\.time/);
    assert.match(rules, /incoming\(\)\.createdAt == existing\(\)\.createdAt/);
    assert.match(rules, /incoming\(\)\.id == existing\(\)\.id/);
  });
});
