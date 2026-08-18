import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGeoChartRows, parseInterestByRegion, resolveCollectionGeoCodes } from './geoChart';

describe('buildGeoChartRows', () => {
  it('returns no rows for GLOBAL-only or empty geo (no fake world bar)', () => {
    assert.deepEqual(buildGeoChartRows({ regions: ['GLOBAL'] }), []);
    assert.deepEqual(buildGeoChartRows({ regions: ['global', 'WW', 'WORLD'] }), []);
    assert.deepEqual(buildGeoChartRows({ regions: [] }), []);
    assert.deepEqual(buildGeoChartRows({}), []);
  });

  it('maps country codes to names and keeps real countries when mixed with GLOBAL', () => {
    const rows = buildGeoChartRows({ regions: ['GLOBAL', 'IN', 'US', 'UK'] });
    assert.equal(rows.length, 3);
    assert.equal(rows[0].region, 'India');
    assert.equal(rows[1].region, 'United States');
    assert.equal(rows[2].region, 'United Kingdom');
    assert.ok(rows.every((r) => r.share > 0));
  });

  it('caps at top 10 countries by share', () => {
    const shares = [
      { country: 'US', share: 100 },
      { country: 'IN', share: 90 },
      { country: 'GB', share: 80 },
      { country: 'BR', share: 70 },
      { country: 'DE', share: 60 },
      { country: 'JP', share: 50 },
      { country: 'KR', share: 40 },
      { country: 'MX', share: 30 },
      { country: 'AU', share: 20 },
      { country: 'CA', share: 10 },
      { country: 'FR', share: 5 },
      { country: 'IT', share: 1 },
    ];
    const rows = buildGeoChartRows({ shares });
    assert.equal(rows.length, 10);
    assert.equal(rows[0].code, 'US');
    assert.equal(rows[9].code, 'CA');
    assert.ok(!rows.some((r) => r.code === 'FR' || r.code === 'IT'));
  });

  it('prefers explicit shares over region-code order', () => {
    const rows = buildGeoChartRows({
      regions: ['IN', 'US'],
      shares: [
        { country: 'US', share: 40 },
        { country: 'IN', share: 100 },
      ],
    });
    assert.equal(rows[0].code, 'IN');
    assert.equal(rows[0].share, 100);
    assert.equal(rows[1].code, 'US');
    assert.equal(rows[1].share, 40);
  });
});

describe('parseInterestByRegion', () => {
  it('parses SerpAPI interest_by_region payloads into country shares', () => {
    const rows = parseInterestByRegion({
      interest_by_region: [
        { geo: 'US', location: 'United States', extracted_value: 100 },
        { geo: 'IN', extracted_value: 72 },
        { geo: 'GB', value: '41' },
      ],
    });
    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], { country: 'US', share: 100 });
    assert.deepEqual(rows[1], { country: 'IN', share: 72 });
    assert.deepEqual(rows[2], { country: 'GB', share: 41 });
  });

  it('ignores GLOBAL / non-country entries', () => {
    const rows = parseInterestByRegion({
      interest_by_region: [
        { geo: 'GLOBAL', extracted_value: 100 },
        { country_code: 'BR', value: 55 },
      ],
    });
    assert.deepEqual(rows, [{ country: 'BR', share: 55 }]);
  });
});

describe('resolveCollectionGeoCodes', () => {
  it('does not stamp GLOBAL as a country code', () => {
    assert.deepEqual(resolveCollectionGeoCodes('GLOBAL'), []);
    assert.deepEqual(resolveCollectionGeoCodes(null, 'GLOBAL'), []);
    assert.deepEqual(resolveCollectionGeoCodes(undefined, ''), []);
  });

  it('returns a 2-letter country when a real geo is provided', () => {
    assert.deepEqual(resolveCollectionGeoCodes('IN'), ['IN']);
    assert.deepEqual(resolveCollectionGeoCodes(null, 'us'), ['US']);
  });
});
