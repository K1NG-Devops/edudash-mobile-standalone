// Supabase Edge Function: webhooks-payfast
// Validates PayFast ITN signature and updates subscription status

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lightweight MD5 (no remote imports) — adapted from public domain implementations
function md5(input: string): string {
  function toUtf8(s: string): string { return unescape(encodeURIComponent(s)); }
  function rhex(n: number): string { const hex = '0123456789abcdef'; let s = ''; for (let j=0;j<4;j++) s += hex.charAt((n>>(j*8+4))&0x0f)+hex.charAt((n>>(j*8))&0x0f); return s; }
  function add(x: number, y: number){ return (((x & 0xffff) + (y & 0xffff)) | 0) + ((((x >>> 16) + (y >>> 16)) & 0xffff) << 16); }
  function rol(num: number, cnt: number){ return (num << cnt) | (num >>> (32 - cnt)); }
  function cmn(q: number,a: number,b: number,x: number,s: number,t: number){ return add(rol(add(add(a,q),add(x,t)),s),b); }
  function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number){ return cmn((b & c) | (~b & d),a,b,x,s,t); }
  function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number){ return cmn((b & d) | (c & ~d),a,b,x,s,t); }
  function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number){ return cmn(b ^ c ^ d,a,b,x,s,t); }
  function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number){ return cmn(c ^ (b | ~d),a,b,x,s,t); }
  function binl(s: string){
    const str = toUtf8(s); const n = str.length; const x = new Array<number>(((n + 8) >> 6) + 1); for (let i=0;i<x.length;i++) x[i]=0;
    for (let i=0;i<n;i++) x[i>>2] |= str.charCodeAt(i) << ((i%4)*8); x[n>>2] |= 0x80 << ((n%4)*8); x[((n+8)>>6)*16+14]=n*8;
    let a=1732584193, b=-271733879, c=-1732584194, d=271733878;
    for (let i=0;i<x.length;i+=16){ const olda=a,oldb=b,oldc=c,oldd=d;
      a=ff(a,b,c,d,x[i+0],7,-680876936); d=ff(d,a,b,c,x[i+1],12,-389564586); c=ff(c,d,a,b,x[i+2],17,606105819); b=ff(b,c,d,a,x[i+3],22,-1044525330);
      a=ff(a,b,c,d,x[i+4],7,-176418897); d=ff(d,a,b,c,x[i+5],12,1200080426); c=ff(c,d,a,b,x[i+6],17,-1473231341); b=ff(b,c,d,a,x[i+7],22,-45705983);
      a=ff(a,b,c,d,x[i+8],7,1770035416); d=ff(d,a,b,c,x[i+9],12,-1958414417); c=ff(c,d,a,b,x[i+10],17,-42063); b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12],7,1804603682); d=ff(d,a,b,c,x[i+13],12,-40341101); c=ff(c,d,a,b,x[i+14],17,-1502002290); b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+1],5,-165796510); d=gg(d,a,b,c,x[i+6],9,-1069501632); c=gg(c,d,a,b,x[i+11],14,643717713); b=gg(b,c,d,a,x[i+0],20,-373897302);
      a=gg(a,b,c,d,x[i+5],5,-701558691); d=gg(d,a,b,c,x[i+10],9,38016083); c=gg(c,d,a,b,x[i+15],14,-660478335); b=gg(b,c,d,a,x[i+4],20,-405537848);
      a=gg(a,b,c,d,x[i+9],5,568446438); d=gg(d,a,b,c,x[i+14],9,-1019803690); c=gg(c,d,a,b,x[i+3],14,-187363961); b=gg(b,c,d,a,x[i+8],20,1163531501);
      a=gg(a,b,c,d,x[i+13],5,-1444681467); d=gg(d,a,b,c,x[i+2],9,-51403784); c=gg(c,d,a,b,x[i+7],14,1735328473); b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+5],4,-378558); d=hh(d,a,b,c,x[i+8],11,-2022574463); c=hh(c,d,a,b,x[i+11],16,1839030562); b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+1],4,-1530992060); d=hh(d,a,b,c,x[i+4],11,1272893353); c=hh(c,d,a,b,x[i+7],16,-155497632); b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13],4,681279174); d=hh(d,a,b,c,x[i+0],11,-358537222); c=hh(c,d,a,b,x[i+3],16,-722521979); b=hh(b,c,d,a,x[i+6],23,76029189);
      a=hh(a,b,c,d,x[i+9],4,-640364487); d=hh(d,a,b,c,x[i+12],11,-421815835); c=hh(c,d,a,b,x[i+15],16,530742520); b=hh(b,c,d,a,x[i+2],23,-995338651);
      a=ii(a,b,c,d,x[i+0],6,-198630844); d=ii(d,a,b,c,x[i+7],10,1126891415); c=ii(c,d,a,b,x[i+14],15,-1416354905); b=ii(b,c,d,a,x[i+5],21,-57434055);
      a=ii(a,b,c,d,x[i+12],6,1700485571); d=ii(d,a,b,c,x[i+3],10,-1894986606); c=ii(c,d,a,b,x[i+10],15,-1051523); b=ii(b,c,d,a,x[i+1],21,-2054922799);
      a=ii(a,b,c,d,x[i+8],6,1873313359); d=ii(d,a,b,c,x[i+15],10,-30611744); c=ii(c,d,a,b,x[i+6],15,-1560198380); b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+4],6,-145523070); d=ii(d,a,b,c,x[i+11],10,-1120210379); c=ii(c,d,a,b,x[i+2],15,718787259); b=ii(b,c,d,a,x[i+9],21,-343485551);
      a=add(a,olda); b=add(b,oldb); c=add(c,oldc); d=add(d,oldd);
    }
    return rhex(a) + rhex(b) + rhex(c) + rhex(d);
  }
  return binl(input);
}

function buildSignaturePayload(params: Record<string, string>, passphrase?: string) {
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'signature' && params[k] !== undefined && params[k] !== '')
    .sort();
  const paramString = sortedKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  return passphrase ? `${paramString}&passphrase=${encodeURIComponent(passphrase)}` : paramString;
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const contentType = req.headers.get('content-type') || '';
    const text = await req.text();

    let params: Record<string, string> = {};
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const usp = new URLSearchParams(text);
      usp.forEach((v, k) => { params[k] = v; });
    } else {
      // Try JSON fallback
      try {
        params = JSON.parse(text);
      } catch {
        return new Response('Invalid payload', { status: 400 });
      }
    }

    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE') || '';
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID') || '';

    // Validate merchant
    if (merchantId && params['merchant_id'] && params['merchant_id'] !== merchantId) {
      return new Response('Invalid merchant', { status: 400 });
    }

    // Validate signature
    const payload = buildSignaturePayload(params, passphrase);
    const expected = md5(payload);
    const provided = (params['signature'] || '').toLowerCase();
    if (!expected || expected !== provided) {
      return new Response('Invalid signature', { status: 400 });
    }

    // Update subscription status & insert payment record
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SERVER_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRole) {
      return new Response('Missing service role key', { status: 500 });
    }
    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const paymentStatus = params['payment_status'] || '';
    const mPaymentId = params['m_payment_id'] || '';
    const pfPaymentId = params['pf_payment_id'] || '';

    if (!mPaymentId) {
      return new Response('Missing payment id', { status: 400 });
    }

    let subStatus: 'active' | 'past_due' | 'trial' = 'trial';
    if (paymentStatus === 'COMPLETE') subStatus = 'active';
    else if (paymentStatus === 'FAILED') subStatus = 'past_due';

    const { error } = await admin
      .from('platform_subscriptions')
      .update({
        status: subStatus,
        provider_subscription_id: pfPaymentId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('metadata->>payment_id', mPaymentId);

    if (error) {
      return new Response(`DB error: ${error.message}`, { status: 500 });
    }

    // Look up subscription id for payments FK
    const { data: subRow } = await admin
      .from('platform_subscriptions')
      .select('id')
      .eq('metadata->>payment_id', mPaymentId)
      .maybeSingle();

    // Map PayFast status to our allowed payment statuses
    const mapStatus = (s: string): 'completed' | 'pending' | 'failed' | 'refunded' => {
      switch (s.toUpperCase()) {
        case 'COMPLETE':
          return 'completed';
        case 'PENDING':
          return 'pending';
        case 'FAILED':
          return 'failed';
        case 'REFUNDED':
          return 'refunded';
        default:
          return 'pending';
      }
    };

    // Insert payment row (best-effort)
    try {
      if (subRow?.id) {
        const amount = paymentStatus === 'COMPLETE' ? Number(params['amount_net'] || params['amount_gross'] || 0) : Number(params['amount_gross'] || 0);
        const processedAt = params['billing_date'] || new Date().toISOString();
        await admin
          .from('subscription_payments')
          .insert({
            subscription_id: subRow.id,
            amount,
            currency: 'ZAR',
            status: mapStatus(paymentStatus),
            provider_payment_id: pfPaymentId || null,
            processed_at: processedAt,
            metadata: { payfast: params },
          });
      }
    } catch (_) {
      // non-fatal
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500 });
  }
});

