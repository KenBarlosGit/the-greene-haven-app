import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ── Config ────────────────────────────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'The Greene Haven <bookings@thegreenehaven.com>';
const VENUE_NAME     = 'The Greene Haven';
const RATE_PER_NIGHT = 1800;
const ADMIN_EMAILS   = ['kmcjkbarlos@gmail.com', 'gmfernandez11@gmail.com', 'thegreenehaven@gmail.com'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function nightsBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH')}`;
}

async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend: ${await res.text()}`);
}

// ── Email templates ───────────────────────────────────────────────────────────
function guestEmail(b: Record<string, unknown>, nights: number, total: string): string {
  const nightLabel = nights === 1 ? '1 night' : `${nights} nights`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Inter,Arial,sans-serif;color:#18181b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3a6147,#142a1a);padding:32px 40px;text-align:center">
            <p style="margin:0;color:rgba(255,255,255,.6);font-size:12px;letter-spacing:.15em;text-transform:uppercase">
              Booking Confirmation
            </p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-.5px">
              ${VENUE_NAME}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#142a1a">
              Hi ${b.guest_name},
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6">
              Your booking is confirmed! We look forward to welcoming you.
              Here's a summary of your stay.
            </p>

            <!-- Booking card -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f4f7f4;border-radius:12px;padding:24px;margin-bottom:28px">
              <tr>
                <td style="padding-bottom:16px;border-bottom:1px solid #d6e5d9">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="vertical-align:top">
                        <p style="margin:0;font-size:11px;color:#52525b;text-transform:uppercase;letter-spacing:.08em;font-weight:600">
                          Check-in
                        </p>
                        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#142a1a">
                          ${formatDate(b.start_date as string)}
                        </p>
                      </td>
                      <td width="50%" style="vertical-align:top;padding-left:16px">
                        <p style="margin:0;font-size:11px;color:#52525b;text-transform:uppercase;letter-spacing:.08em;font-weight:600">
                          Check-out
                        </p>
                        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#142a1a">
                          ${formatDate(b.end_date as string)}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="padding-top:16px">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${row('Time', b.time as string)}
                  ${row('Duration', nightLabel)}
                  ${row('Party size', `${b.party_size} ${Number(b.party_size) === 1 ? 'guest' : 'guests'}`)}
                  ${b.notes ? row('Notes', b.notes as string) : ''}
                  ${rowBold('Total', total)}
                </table>
              </td></tr>
            </table>

            <p style="margin:0;font-size:14px;color:#71717a;line-height:1.6">
              If you need to make changes, please contact us at
              <a href="mailto:thegreenehaven@gmail.com" style="color:#3a6147">thegreenehaven@gmail.com</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e4e4e7;text-align:center">
            <p style="margin:0;font-size:12px;color:#a1a1aa">
              © ${new Date().getFullYear()} ${VENUE_NAME} · A Place to Gather, Unwind &amp; Stay
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function adminEmail(b: Record<string, unknown>, nights: number, total: string): string {
  const nightLabel = nights === 1 ? '1 night' : `${nights} nights`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Inter,Arial,sans-serif;color:#18181b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">

        <tr>
          <td style="background:linear-gradient(135deg,#3a6147,#142a1a);padding:24px 40px">
            <p style="margin:0;color:rgba(255,255,255,.6);font-size:11px;letter-spacing:.15em;text-transform:uppercase">
              Admin Notification
            </p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700">
              New Booking Received
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f4f7f4;border-radius:12px;padding:24px">
              <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${row('Guest', b.guest_name as string)}
                  ${row('Email', b.guest_email as string)}
                  ${row('Check-in', formatDate(b.start_date as string))}
                  ${row('Check-out', formatDate(b.end_date as string))}
                  ${row('Time', b.time as string)}
                  ${row('Duration', nightLabel)}
                  ${row('Party size', `${b.party_size} ${Number(b.party_size) === 1 ? 'guest' : 'guests'}`)}
                  ${b.notes ? row('Notes', b.notes as string) : ''}
                  ${rowBold('Total', total)}
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e4e4e7;text-align:center">
            <p style="margin:0;font-size:12px;color:#a1a1aa">
              ${VENUE_NAME} Admin · This is an automated notification.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:5px 0;font-size:13px;color:#71717a;width:120px;vertical-align:top">${label}</td>
    <td style="padding:5px 0;font-size:13px;color:#18181b;font-weight:500">${value}</td>
  </tr>`;
}

function rowBold(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0 5px;font-size:13px;color:#71717a;width:120px;border-top:1px solid #d6e5d9;padding-top:12px;font-weight:600">${label}</td>
    <td style="padding:10px 0 5px;font-size:16px;color:#142a1a;font-weight:700;border-top:1px solid #d6e5d9;padding-top:12px">${value}</td>
  </tr>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500 });
  }

  try {
    const { record: b } = await req.json() as { record: Record<string, unknown> };

    const nights = nightsBetween(b.start_date as string, b.end_date as string);
    const total  = formatCurrency(RATE_PER_NIGHT * Math.max(1, nights));

    const sends: Promise<void>[] = [];

    // Guest confirmation
    if (b.guest_email) {
      sends.push(
        sendEmail(
          b.guest_email as string,
          `Your booking is confirmed — ${VENUE_NAME}`,
          guestEmail(b, nights, total),
        ),
      );
    }

    // Admin notification
    sends.push(
      sendEmail(
        ADMIN_EMAILS,
        `New booking: ${b.guest_name} · ${formatDate(b.start_date as string)}`,
        adminEmail(b, nights, total),
      ),
    );

    await Promise.all(sends);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
