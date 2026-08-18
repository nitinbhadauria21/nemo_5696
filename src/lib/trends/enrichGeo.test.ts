import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSearchApiInterestByRegionUrl,
  buildSerpInterestByRegionUrl,
  collectRealGeoShares,
} from './enrichGeo';

const noSleep = async () => {};

describe('buildSerpInterestByRegionUrl', () => {
  it('uses GEO_MAP_0 and COUNTRY region for single-query interest by region', () => {
    const url = new URL(buildSerpInterestByRegionUrl('coffee', 'test-key'));
    assert.equal(url.searchParams.get('engine'), 'google_trends');
    assert.equal(url.searchParams.get('data_type'), 'GEO_MAP_0');
    assert.equal(url.searchParams.get('region'), 'COUNTRY');
    assert.equal(url.searchParams.get('q'), 'coffee');
  });

  it('can target YouTube property for YouTube-native trends', () => {
    const url = new URL(
      buildSerpInterestByRegionUrl('viral shorts', 'test-key', { gprop: 'youtube' })
    );
    assert.equal(url.searchParams.get('gprop'), 'youtube');
  });
});

describe('buildSearchApiInterestByRegionUrl', () => {
  it('uses GEO_MAP with COUNTRY region for worldwide country breakdown', () => {
    const url = new URL(buildSearchApiInterestByRegionUrl('coffee', 'test-key'));
    assert.equal(url.searchParams.get('data_type'), 'GEO_MAP');
    assert.equal(url.searchParams.get('region'), 'COUNTRY');
    assert.equal(url.searchParams.get('q'), 'coffee');
  });
});

describe('collectRealGeoShares', () => {
  it('returns stored API shares without calling the network', async () => {
    let fetches = 0;
    const shares = await collectRealGeoShares({
      title: 'AI agents',
      existingShares: [
        { country: 'US', share: 100 },
        { country: 'IN', share: 80 },
      ],
      fetchInterestByRegion: async () => {
        fetches += 1;
        return [];
      },
      sleep: noSleep,
    });
    assert.equal(fetches, 0);
    assert.equal(shares[0].country, 'US');
    assert.equal(shares.length, 2);
  });

  it('retries Google Trends GEO_MAP until real countries arrive', async () => {
    let fetches = 0;
    const shares = await collectRealGeoShares({
      title: 'stale crisps',
      existingRegions: ['GLOBAL'],
      attempts: 4,
      delayMs: 0,
      sleep: noSleep,
      fetchInterestByRegion: async () => {
        fetches += 1;
        if (fetches < 3) return [];
        return [
          { country: 'GB', share: 100 },
          { country: 'IN', share: 72 },
        ];
      },
    });
    assert.equal(fetches, 3);
    assert.equal(shares.length, 2);
    assert.equal(shares[0].country, 'GB');
  });

  it('does not invent GLOBAL or fake percentages when every source fails', async () => {
    const shares = await collectRealGeoShares({
      title: 'unknown topic',
      existingRegions: ['GLOBAL', 'WW'],
      attempts: 2,
      delayMs: 0,
      sleep: noSleep,
      fetchInterestByRegion: async () => [],
    });
    assert.deepEqual(shares, []);
  });
});
