import { useEffect, useRef, useState } from 'react';
const scenarios = [
  ['valid', '正常JSON'], ['invalid-json', '格式损坏'], ['wrong-shape', '字段不合约'],
  ['empty-summary', '语义不合约'], ['timeout', '上游超时'], ['upstream-error', '上游故障'],
];
export function App() {
  const [health, setHealth] = useState('检查中');
  const [text, setText] = useState('订单列表一直转圈，刷新后仍然打不开。');
  const [scenario, setScenario] = useState('valid');
  const [result, setResult] = useState('从课程文档开始。核心业务留作第一阶段作业，未实现时接口会返回501。');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/health', { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error('health');
      const data = await response.json() as { provider: string };
      setHealth('API在线 · ' + data.provider + '模式');
    }).catch(() => { if (!abort.signal.aborted) setHealth('API未连接，请检查8787端口'); });
    return () => abort.abort();
  }, []);
  async function submit() {
    controller.current = new AbortController();
    setBusy(true);
    try {
      const response = await fetch('/api/triage', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, scenario }), signal: controller.current.signal,
      });
      const body: unknown = await response.json();
      setResult('HTTP ' + response.status + '\n' + JSON.stringify(body, null, 2));
    } catch (error) {
      setResult(error instanceof Error && error.name === 'AbortError'
        ? '已取消当前HTTP请求。请通过服务端证据验证上游任务是否也终止。'
        : '请求失败：' + String(error));
    } finally { setBusy(false); }
  }
  return (
    <main>
      <header><a className="brand" href="https://github.com/Xeehho/agent-engineering-lab">AGENT ENGINEERING LAB</a><span className="badge">{health}</span></header>
      <section className="intro">
        <p className="eyebrow">STAGE 01 / 模型应用基础</p>
        <h1>把AI交付<br />变成可解释的工程能力。</h1>
        <p>智能工单分诊 · 结构化输出 · 错误处理 · 流式响应</p>
      </section>
      <section className="workspace">
        <article className="panel">
          <h2>第一份实验</h2>
          <p className="muted">允许AI Coding。每次修改都需要你定义预期、核对结果、解释失败。</p>
          <label htmlFor="ticket">工单内容</label>
          <textarea id="ticket" value={text} onChange={event => setText(event.target.value)} rows={5} />
          <label htmlFor="scenario">离线模型情境</label>
          <select id="scenario" value={scenario} onChange={event => setScenario(event.target.value)}>
            {scenarios.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="actions">
            <button disabled={busy} onClick={() => void submit()}>{busy ? '执行中…' : '提交分诊'}</button>
            <button className="secondary" disabled={!busy} onClick={() => controller.current?.abort()}>取消请求</button>
          </div>
          <p className="note">当前仅调用本地模拟器，不读取Key、不调用真实模型。流式面板由S1-T4完成。</p>
        </article>
        <article className="panel output"><h2>响应与证据</h2><pre aria-live="polite">{result}</pre></article>
      </section>
      <section className="steps">
        <article><span>01</span><h3>先定义正确</h3><p>阅读任务契约，写出正常、异常和边界输入的预期行为。</p></article>
        <article><span>02</span><h3>再协作实现</h3><p>让AI参与实现，亲自追踪数据流、错误路径和验证结果。</p></article>
        <article><span>03</span><h3>交卷与答辩</h3><p>提交代码与复盘，老师按当前commit出变式题并评定阶段结果。</p></article>
      </section>
      <footer>课程入口：course/stage-01/plan.md · 作业状态：待开始 · 绿色CI代表工程骨架正常</footer>
    </main>
  );
}

