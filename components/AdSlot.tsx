'use client';

import { useEffect, useState } from 'react';

type Ad = {
  id: string;
  name: string;
  type: string;
  media_url: string | null;
  target_url: string | null;
};

export default function AdSlot({ placement }: { placement: string }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch(`/api/ads?placement=${encodeURIComponent(placement)}`)
      .then((res) => res.json())
      .then((body) => setAd(body.ad ?? null))
      .catch(() => setAd(null))
      .finally(() => setChecked(true));
  }, [placement]);

  if (!checked) return null;

  if (!ad) {
    return (
      <div className="adslot">
        <svg className="icon">
          <use href="#i-mega" />
        </svg>
        Advertisement space — {placement}
      </div>
    );
  }

  const content = ad.media_url ? (
    ad.type === 'Video' ? (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={ad.media_url} autoPlay muted loop style={{ maxWidth: '100%', maxHeight: 60 }} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ad.media_url} alt={ad.name} style={{ maxWidth: '100%', maxHeight: 60 }} />
    )
  ) : (
    <span>{ad.name}</span>
  );

  return (
    <a
      href={ad.target_url ?? '#'}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="adslot"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {content}
    </a>
  );
}