# Channel manager · the wire contract

Teak House speaks one signed JSON contract in both directions. A partner
(Booking.com, Agoda, Expedia, SiteMinder, Exely, Hoteliers.guru, or a custom
integration) either speaks it directly or gets a thin translator at the edge;
the PMS side never changes.

## Signing

Every request carries two headers:

```
x-tkh-timestamp: <unix seconds>
x-tkh-signature: sha256=<hex HMAC-SHA256 of "<timestamp>.<raw body>" with the shared secret>
```

The receiver rejects a timestamp more than five minutes old, so a captured
request cannot be replayed. The secret is set per channel on `/owner/channels`
and stored encrypted when `GUEST_VAULT_KEY` is configured.

## Outbound · ARI push (PMS → channel)

Sent to the channel's endpoint after every booking, cancellation, block or
rate change, and re-sent from the outbox until the channel answers 2xx.
`idempotency-key` carries the outbox key · a channel receiving the same key
twice must not act twice.

```json
{
  "event": "availability.changed",
  "key": "avail:bk-1727-42:create",
  "hotelId": "default",
  "sentAt": "2026-09-27T09:12:44.000Z",
  "reason": "booking.created",
  "rooms": [
    {
      "roomId": "river-loft",
      "externalRoomId": "LOO-1001",
      "externalRateId": "BAR",
      "dates": [
        { "date": "2026-10-01", "available": 1, "rate": 3900, "currency": "THB" },
        { "date": "2026-10-02", "available": 0, "rate": 4290, "currency": "THB" }
      ]
    }
  ]
}
```

`available` is in **units** (a villa type with three units reports 0–3).
`rate` is the calendar rate for the date; demand pricing is applied per quote
and is not pushed.

## Inbound · reservations (channel → PMS)

`POST /api/channels/{channelId}/webhook`

```json
{
  "type": "reservation.created",
  "externalId": "BDC-88213377",
  "externalRoomId": "LOO-1001",
  "checkIn": "2026-10-01",
  "checkOut": "2026-10-03",
  "guest": { "name": "Claire Dubois", "email": "claire@example.com", "phone": "+33 6 12 34 56 78" },
  "adults": 2,
  "children": 0,
  "amount": 8190,
  "notes": "Late arrival"
}
```

`type` is one of `reservation.created`, `reservation.modified` (cancel +
recreate), `reservation.cancelled`. `amount` is what the guest paid the
channel, in THB, and is stored as the booking amount; availability is still
enforced.

Responses:

| Status | Meaning |
| --- | --- |
| 201 | created · `{ accepted: true, bookingCode, bookingId }` |
| 200 | duplicate delivery · `{ accepted: true, duplicate: true }` (no-op) |
| 409 | **no unit left** · `{ accepted: false, reason: "overbooked", alternatives: [{ checkIn, checkOut }] }` |
| 401 | bad or missing signature |
| 422 | unmapped room, missing dates, past dates, minimum-stay violation |

The 409 is the whole point: the reservation went through the same advisory
lock as a direct booking, so the last unit cannot be sold twice whichever
side asks second.

## Sandbox

The seeded **loopback** channel has every room mapped and the secret
`demo-loopback-secret`. Pushes to it are recorded in the audit log instead of
leaving the building. "Send test reservation" on `/owner/channels` builds a
signed event and runs it through the real inbound handler; send it twice for
the last unit and watch the second one come back 409.

## Cron

`vercel.json` schedules `/api/channels/sync` daily (Hobby plan) to flush
anything the per-request dispatch left behind; on a Pro plan set it to every
few minutes. `POST /api/channels/sync` pushes on demand.
