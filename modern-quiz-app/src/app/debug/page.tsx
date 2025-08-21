'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const boxes = [1, 2, 3]; // 3-box system only

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Leitner Box Color Debug</h1>
        
        {/* Surface Classes Test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Surface Classes (leitner-box-surface-X)</h2>
          <div className="grid grid-cols-3 gap-4">
            {boxes.map((box) => (
              <Card key={box} className={`leitner-box-surface-${box} min-h-[120px]`}>
                <CardHeader>
                  <CardTitle className={`leitner-box-text-${box}`}>Box {box}</CardTitle>
                </CardHeader>
                <CardContent className={`leitner-box-text-${box}`}>
                  <p>Surface class test</p>
                  <p className="text-sm opacity-75">leitner-box-surface-{box}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Dot Classes Test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Dot Classes (leitner-box-dot-X)</h2>
          <div className="flex gap-4 items-center">
            {boxes.map((box) => (
              <div key={box} className="flex items-center gap-2">
                <span className={`h-4 w-4 rounded-full leitner-box-dot-${box}`}></span>
                <span>Box {box}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Text Classes Test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Text Classes (leitner-box-text-X)</h2>
          <div className="space-y-2">
            {boxes.map((box) => (
              <p key={box} className={`leitner-box-text-${box} p-2 rounded`}>
                Box {box} text color (leitner-box-text-{box})
              </p>
            ))}
          </div>
        </section>

        {/* Background Classes Test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Background Classes (leitner-box-bg-X)</h2>
          <div className="grid grid-cols-3 gap-4">
            {boxes.map((box) => (
              <div key={box} className={`leitner-box-bg-${box} p-4 rounded text-center min-h-[80px] flex items-center justify-center`}>
                Box {box} BG
              </div>
            ))}
          </div>
        </section>

        {/* CSS Variable Test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">CSS Variables Test</h2>
          <div className="grid grid-cols-3 gap-4">
            {boxes.map((box) => (
              <div 
                key={box} 
                style={{ 
                  backgroundColor: `hsl(var(--box${box}-bg))`,
                  color: `hsl(var(--box${box}-fg))`,
                  border: `1px solid hsl(var(--box${box}-fg))`
                }}
                className="p-4 rounded text-center min-h-[80px] flex items-center justify-center"
              >
                Box {box} CSS Vars
              </div>
            ))}
          </div>
        </section>

        {/* Transparent Background Test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Transparent Background Classes</h2>
          <div className="grid grid-cols-3 gap-4">
            {boxes.map((box) => (
              <div key={box} className={`leitner-box-surface-transparent-${box} p-4 rounded text-center min-h-[80px] flex items-center justify-center border`}>
                Box {box} Transparent
              </div>
            ))}
          </div>
        </section>

        {/* Raw CSS Check */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Manual CSS Test</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 text-red-800 p-4 rounded text-center">Box 1 Manual</div>
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded text-center">Box 2 Manual</div>
            <div className="bg-green-50 text-green-800 p-4 rounded text-center">Box 3 Manual</div>
          </div>
        </section>
      </div>
    </div>
  );
}
