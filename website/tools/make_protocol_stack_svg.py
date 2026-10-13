layers = [("L0","Physical Truth"),("L1","Core"),("L2","Economic"),("L3","Security"),("L4","Stability"),
          ("L5","Human Infrastructure"),("L6","Intersystem"),("L7","Meta / Scope"),("L8","Infrastructure")]
def mix(a,b,t):
    a=[int(a[i:i+2],16) for i in (1,3,5)]; b=[int(b[i:i+2],16) for i in (1,3,5)]
    return "#"+"".join(f"{round(x+(y-x)*t):02x}" for x,y in zip(a,b))
W,H=600,468; cx=190; hw=150; hh=52; base=356; step=36; th=9
out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-labelledby="stack-title stack-desc">',
 '<title id="stack-title">The Dikenocracy protocol stack</title>',
 '<desc id="stack-desc">Nine protocol layers stacked from L0 Physical Truth at the base to L8 Infrastructure at the top. No higher layer may violate a lower-layer constraint.</desc>',
 '<style>.n{font:600 15px "Segoe UI",Helvetica,Arial,sans-serif;fill:#1f2733}.k{font:700 13px "Segoe UI",Helvetica,Arial,sans-serif;letter-spacing:.06em}.s{font:13px Georgia,serif;fill:#5b6573;font-style:italic}</style>']
# shadow
out.append(f'<ellipse cx="{cx}" cy="{base+hh+16}" rx="{hw-10}" ry="12" fill="#1f2733" opacity=".07"/>')
for i,(k,name) in enumerate(layers):
    t=i/(len(layers)-1)
    top=mix("#f3dc9b","#c9c0f2",t); side=mix("#c9a24a","#7d6fd0",t); edge=mix("#a8801f","#5a4bb5",t)
    y=base-i*step
    pts=f"{cx-hw},{y} {cx},{y-hh} {cx+hw},{y} {cx},{y+hh}"
    left=f"{cx-hw},{y} {cx},{y+hh} {cx},{y+hh+th} {cx-hw},{y+th}"
    right=f"{cx+hw},{y} {cx},{y+hh} {cx},{y+hh+th} {cx+hw},{y+th}"
    out.append(f'<g><polygon points="{left}" fill="{side}"/><polygon points="{right}" fill="{edge}"/>'
               f'<polygon points="{pts}" fill="{top}" stroke="#fff" stroke-width="1.5" opacity=".97"/></g>')
    ly=y+5
    out.append(f'<line x1="{cx+hw+6}" y1="{y+3}" x2="{cx+hw+34}" y2="{y+3}" stroke="{edge}" stroke-width="1.5"/>')
    out.append(f'<text x="{cx+hw+42}" y="{ly}"><tspan class="k" fill="{edge}">{k}</tspan><tspan class="n" dx="8">{name}</tspan></text>')
out.append(f'<text class="s" x="{cx}" y="{H-10}" text-anchor="middle">a higher layer never overrides a lower one</text>')
out.append('</svg>')
open(r"E:/dikenocracy-work/repos/Dikenocracy-site/website/assets/protocol-stack-20261013.svg","w",encoding="utf-8",newline="\n").write("\n".join(out)+"\n")
print("ok")
