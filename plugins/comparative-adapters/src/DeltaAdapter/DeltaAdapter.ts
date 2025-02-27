import { BaseOptions } from '@jbrowse/core/data_adapters/BaseAdapter'
import { openLocation } from '@jbrowse/core/util/io'
import { unzip } from '@gmod/bgzf-filehandle'
import PAFAdapter from '../PAFAdapter/PAFAdapter'

function isGzip(buf: Buffer) {
  return buf[0] === 31 && buf[1] === 139 && buf[2] === 8
}

/* paf2delta from paftools.js in the minimap2 repository, license reproduced below
 *
 * The MIT License
 *
 * Copyright (c) 2018-     Dana-Farber Cancer Institute
 *               2017-2018 Broad Institute, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function paf_delta2paf(lines: string[]) {
  let rname = ''
  let qname = ''
  let qs = 0
  let qe = 0
  let rs = 0
  let re = 0
  let strand = 0
  let NM = 0
  let cigar = [] as number[]
  let x = 0
  let y = 0
  let seen_gt = false

  const records = []
  const regex = new RegExp(/^>(\S+)\s+(\S+)\s+(\d+)\s+(\d+)/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = regex.exec(line)
    if (m !== null) {
      rname = m[1]
      qname = m[2]
      seen_gt = true
      continue
    }
    if (!seen_gt) {
      continue
    }
    const t = line.split(' ')
    if (t.length === 7) {
      const t0 = +t[0]
      const t1 = +t[1]
      const t2 = +t[2]
      const t3 = +t[3]
      const t4 = +t[4]
      strand = (t0 < t1 && t2 < t3) || (t0 > t1 && t2 > t3) ? 1 : -1
      rs = +(t0 < t1 ? t0 : t1) - 1
      re = +(t1 > t0 ? t1 : t0)
      qs = +(t2 < t3 ? t2 : t3) - 1
      qe = +(t3 > t2 ? t3 : t2)
      x = y = 0
      NM = t4
      cigar = []
    } else if (t.length === 1) {
      const d = +t[0]
      if (d === 0) {
        let blen = 0
        const cigar_str = []

        if (re - rs - x !== qe - qs - y) {
          throw new Error(`inconsistent alignment on line ${i}`)
        }
        cigar.push((re - rs - x) << 4)
        for (let i = 0; i < cigar.length; ++i) {
          const rlen = cigar[i] >> 4
          blen += rlen
          cigar_str.push(rlen + 'MID'.charAt(cigar[i] & 0xf))
        }

        records.push({
          qname,
          qstart: qs,
          qend: qe,
          tname: rname,
          tstart: rs,
          tend: re,
          strand,
          extra: {
            numMatches: blen - NM,
            blockLen: blen,
            mappingQual: 0,
            NM,
            cg: cigar_str.join(''),
          },
        })
      } else if (d > 0) {
        const l = d - 1
        x += l + 1
        y += l
        if (l > 0) {
          cigar.push(l << 4)
        }
        if (cigar.length > 0 && (cigar[cigar.length - 1] & 0xf) === 2) {
          cigar[cigar.length - 1] += 1 << 4
        } else {
          cigar.push((1 << 4) | 2)
        } // deletion
      } else {
        const l = -d - 1
        x += l
        y += l + 1
        if (l > 0) {
          cigar.push(l << 4)
        }
        if (cigar.length > 0 && (cigar[cigar.length - 1] & 0xf) === 1) {
          cigar[cigar.length - 1] += 1 << 4
        } else {
          cigar.push((1 << 4) | 1)
        } // insertion
      }
    }
  }
  return records
}

export default class DeltaAdapter extends PAFAdapter {
  async setupPre(opts?: BaseOptions) {
    const loc = openLocation(this.getConf('deltaLocation'), this.pluginManager)
    const buffer = (await loc.readFile(opts)) as Buffer
    const buf = isGzip(buffer) ? await unzip(buffer) : buffer
    // 512MB  max chrome string length is 512MB
    if (buf.length > 536_870_888) {
      throw new Error('Data exceeds maximum string length (512MB)')
    }
    const text = new TextDecoder('utf8', { fatal: true }).decode(buf)

    return paf_delta2paf(text.split(/\n|\r\n|\r/).filter(line => !!line))
  }
}
