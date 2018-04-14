function joinLines(lines, tol = 0.000000001) {
  let dist = (a, b) => Math.sqrt(Math.pow(a[0]-b[0],2)+Math.pow(a[1]-b[1],2)+Math.pow(a[2]-b[2],2));
  let i, j, dists, hit, ln, la, lb, lal, lbl;
  let ll = lines.length + 1;

  while (lines.length < ll) {
    ll = lines.length; i = 0;
    while (i < lines.length) {
      la = lines[i]; lal = la.length - 1; j = i + 1;
      while (j < lines.length) {
        lb = lines[j]; lbl = lb.length - 1;

        dists = [dist(la[0], lb[lbl]), dist(la[0], lb[0]), dist(la[lal], lb[0]), dist(la[lal], lb[lbl])];

        hit = dists.findIndex((d) => (d === 0));
        if (hit === -1) {
          hit = dists.findIndex((d) => (d < tol));
        }

        if ( hit !== -1 ) {
          ln = lines.splice(j, 1)[0];
          if ( hit & 1 ) { ln.reverse(); }
          if ( hit & 2 ) {
            la.push(...ln.slice(1));
          } else {
            la.unshift(...ln.slice(0, lbl));
          }
        } else {
          ++j;
        }
      }
      ++i;
    }
  }

  let a, b, c, d, s, m;
  for (i = 0; i < lines.length; ++i) {
    a = lines[i][0]; b = lines[i][1]; c = lines[i][2];
    s = b[0] * c[1] + a[0] * b[1] + a[1] * c[0] - a[1] * b[0] - b[1] * c[0] - a[0] * c[1];
    if (s < 0) lines[i].reverse();
  }
}

function contourFace(A, B, C, D, pax, pay, paz, pbx, pby, pbz, pcx, pcy, pcz) {
  let sideA = A * pax + B * pay + C * paz - D;
  let sideB = A * pbx + B * pby + C * pbz - D;
  let sideC = A * pcx + B * pcy + C * pcz - D;

  if (sideA >= 0 && sideB >= 0 && sideC >= 0) {
    return 0;
  } else if (sideA <= 0 && sideB <= 0 && sideC <= 0) {
    return 0;
  }

  let s0, s1, s2, p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z;
  let sA = Math.sign(sideA), sB = Math.sign(sideB), sC = Math.sign(sideC);

  if (sA != sB && sA != sC) {
    p0x = pax; p1x = pcx - p0x; p2x = pbx - p0x;
    p0y = pay; p1y = pcy - p0y; p2y = pby - p0y;
    p0z = paz; p1z = pcz - p0z; p2z = pbz - p0z;
    s0 = sideA; s1 = sideC - s0; s2 = sideB - s0;
  } else if (sB != sA && sB != sC) {
    p0x = pbx; p1x = pcx - p0x; p2x = pax - p0x;
    p0y = pby; p1y = pcy - p0y; p2y = pay - p0y;
    p0z = pbz; p1z = pcz - p0z; p2z = paz - p0z;
    s0 = sideB; s1 = sideC - s0; s2 = sideA - s0;
  } else if (sC != sB && sC != sA) {
    p0x = pcx; p1x = pax - p0x; p2x = pbx - p0x;
    p0y = pcy; p1y = pay - p0y; p2y = pby - p0y;
    p0z = pcz; p1z = paz - p0z; p2z = pbz - p0z;
    s0 = sideC; s1 = sideA - s0; s2 = sideB - s0;
  } else {
    return 0;
  }

  return [
    [p0x - s0 * p1x / s1, p0y - s0 * p1y / s1, p0z - s0 * p1z / s1],
    [p0x - s0 * p2x / s2, p0y - s0 * p2y / s2, p0z - s0 * p2z / s2]
  ];
}
