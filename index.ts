interface PriceData {
    time: string;
    close: number;
  }
  
  interface Band {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
  }
  
  interface Signal {
    x: number;
    y: number;
    signal: string;
    color: string;
    textColor: string;
    date: Date;
  }
  
  interface Result {
    upBands: Band[];
    dnBands: Band[];
    buySignals: Signal[];
    sellSignals: Signal[];
  }
  
  function calculateNadarayaWatsonEnvelope(
    prices: PriceData[],
    length: number,
    h: number,
    mult: number,
    upCol: string,
    dnCol: string,
    disclaimer: boolean,
  ): Result {
    const src = prices.map((data) => data.close);
    const n = [...Array(length).keys()];
    const k = 2;
    const upper: Band[] = new Array(Math.floor(length / k)).fill({
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      color: upCol,
    });
    const lower: Band[] = new Array(Math.floor(length / k)).fill({
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      color: dnCol,
    });
  
    const result: Result = {
      upBands: [],
      dnBands: [],
      buySignals: [],
      sellSignals: [],
    };
  
    if (!disclaimer) {
      // Bu kısımda "Nadaraya-Watson Envelope [LUX] Repaints" başlığı oluşturabilirsiniz.
      // Ancak, sadece bir uyarı olarak gösterildiği için işlevsel bir rolü yok.
    }
  
    let y: number[] = new Array(length).fill(0);
    let sum_e: number = 0;
  
    for (let i = 0; i < length; i++) {
      let sum = 0;
      let sumw = 0;
  
      for (let j = 0; j < length; j++) {
        const w = Math.exp(-(Math.pow(i - j, 2) / (h * h * 2)));
        sum += src[j] * w;
        sumw += w;
      }
  
      const y2 = sum / sumw;
      sum_e += Math.abs(src[i] - y2);
      y[i] = y2;
    }
  
    const mae = (sum_e / length) * mult;
  
    for (let i = 1; i < length; i++) {
      const y2 = y[i];
      const y1 = y[i - 1];
      const index = Math.floor(i / k);
  
      const up = upper[index];
      const dn = lower[index];
  
      if (up === undefined || dn === undefined) {
        continue;
      }
  
      up.x2 = n[i] - 1;
      up.y2 = y1 + mae;
      up.x1 = n[i] - i;
      up.y1 = y2 + mae;
  
      dn.x2 = n[i] - 1;
      dn.y2 = y1 - mae;
      dn.x1 = n[i] - i;
      dn.y1 = y2 - mae;
  
      if (src[i] > y1 + mae && src[i + 1] < y1 + mae) {
        const buySignal = {
          x: n[i],
          y: src[i],
          signal: '▼',
          color: 'black',
          textColor: dnCol,
          date: new Date(prices[i].time + 3 * 60 * 60 * 1000), // Al sinyali tarihi
        };
  
        result.buySignals.push(buySignal);
      }
  
      if (src[i] < y1 - mae && src[i + 1] > y1 - mae) {
        result.sellSignals.push({
          x: n[i],
          y: src[i],
          signal: '▲',
          color: 'black',
          textColor: upCol,
          date: new Date(prices[i].time + 3 * 60 * 60 * 1000), // Sat sinyali tarihi
        });
      }
    }
  
    for (let i = 0; i < upper.length; i++) {
      const up = upper[i];
      const dn = lower[i];
  
      result.upBands.push({
        x1: up.x1,
        y1: up.y1,
        x2: up.x2,
        y2: up.y2,
        color: upCol,
      });
  
      result.dnBands.push({
        x1: dn.x1,
        y1: dn.y1,
        x2: dn.x2,
        y2: dn.y2,
        color: dnCol,
      });
    }
  
    return result;
  }
  
  async function testEnvelop() {   //  fonksiyonu test etmek için oluşturulan fonksiyon
    const upCol = '#39ff14';
    const dnCol = '#ff1100';
    const disclaimer = false;
    const baseUrl = 'https://api.binance.com';
  
    let data: any = await fetch(
      baseUrl + `/api/v3/klines?symbol=SOLUSDT&interval=30m&limit=200`,
    );
    data = await data.json();
  
    let prices = data
      .map((item) => {
        let date = new Date(item[0] + 3 * 60 * 60 * 1000);
        return {
          time: item[0],
          close: item[4],
        };
      })
      .reverse();
  
    let sonuc = calculateNadarayaWatsonEnvelope(
      prices,
      200,
      8,
      2,
      upCol,
      dnCol,
      disclaimer,
    );
  
    console.log('sonuc ==>', sonuc.upBands);
  }
  
testEnvelop()