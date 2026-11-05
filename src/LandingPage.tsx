import { useState } from 'react';
import { courseOverview } from './generated/course-overview.ts';
import { developer, faqs, foundations, outcomes } from './site-content.ts';
import { Icon } from './Icons.tsx';

const firstLesson = '/learn.html#S1-L01/lecture';
const roadmap = '/learn.html#S1-L01/roadmap';

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [prepared, setPrepared] = useState<string[]>([]);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { stats, stages } = courseOverview;
  const remaining = foundations.filter(item => item.id !== 'tools' && !prepared.includes(item.id));
  const togglePrepared = (id: string) => setPrepared(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  return (
    <div className="landing">
      <a className="home-skip" href="#home-main">跳到课程介绍</a>
      <header className="home-header">
        <div className="home-header-inner">
          <a className="home-brand" href="/" aria-label="Agent Engineering Lab 首页">
            <span className="home-brand-mark" aria-hidden="true">a<span>↗</span></span>
            <span>Agent Engineering <b>Lab</b><small>从 AI Coding 到 AI 应用工程</small></span>
          </a>
          <button className="mobile-nav-toggle" type="button" aria-expanded={menuOpen} aria-controls="home-navigation" aria-label={menuOpen ? '收起导航' : '展开导航'} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
          <nav className={'home-navigation' + (menuOpen ? ' is-open' : '')} id="home-navigation" aria-label="首页导航">
            <a href="#outcomes" onClick={() => setMenuOpen(false)}>学习成果</a>
            <a href="#curriculum" onClick={() => setMenuOpen(false)}>课程路线</a>
            <a href="#prerequisites" onClick={() => setMenuOpen(false)}>学习准备</a>
            <a href="#author" onClick={() => setMenuOpen(false)}>关于作者</a>
          </nav>
          <a className="home-button home-star" href={developer.repository} target="_blank" rel="noopener noreferrer"><Icon name="star" /> GitHub Star <span aria-hidden="true">↗</span></a>
        </div>
      </header>
      <main id="home-main">
        <section className="home-hero home-container" aria-labelledby="home-title">
          <div className="hero-editorial">
            <div className="hero-intro-label"><span className="home-status-dot" /> 为有编程基础的开发者而设计</div>
            <p className="home-eyebrow">BUILD. UNDERSTAND. VERIFY.</p>
            <h1 id="home-title">从 AI Coding，<br />走向 <em>AI 应用工程。</em></h1>
            <p className="hero-description">把会用 AI 写代码，变成能设计、能解释、能验证的工程能力。用一个持续演进的项目，建立你的 AI 应用知识体系。</p>
            <div className="hero-cta"><a className="home-button primary" href={firstLesson}>开始第一课 <Icon name="arrow" /></a><a className="hero-secondary" href="#prerequisites">先看看适不适合我 <span aria-hidden="true">↓</span></a></div>
            <p className="hero-footnote">网站内直接学 <span>·</span> 无需启动项目 <span>·</span> 无需 API Key</p>
            <a className="resume-learning" href="/learn.html">已有学习记录？继续学习 <span aria-hidden="true">↗</span></a>
          </div>
          <div className="hero-classroom-preview" aria-label="第一课教学示意：HTTP 200 不代表业务正确">
            <div className="preview-topline"><span className="preview-dots" aria-hidden="true"><i /><i /><i /></span><span>THE FIRST QUESTION</span><span>S1–L01</span></div>
            <div className="preview-body">
              <div className="preview-lesson-caption"><span>课堂例题</span><span>01 / {stats.lessons}</span></div>
              <h2>返回了 200，<br />就算成功了吗？</h2>
              <div className="preview-input"><span>用户反馈</span><p>“订单页打开后白屏。”</p></div>
              <div className="preview-output"><div><Icon name="code" /><span>model-response.json</span></div><pre><code>{'{\n  "category": "feature",\n  "priority": "medium",\n  "summary": "新增订单统计功能",\n  "missingInformation": []\n}'}</code></pre></div>
              <div className="preview-boundaries"><span><i>✓</i> 调用正常</span><span><i>✓</i> 格式合法</span><span className="needs-review"><i>!</i> 内容答错</span></div>
              <a href={firstLesson} className="preview-next">从这一课，开始建立自己的判断 <Icon name="arrow" /></a>
            </div>
            <div className="preview-margin-note"><span>01</span><p>拿到响应只是开始。<br />你的判断，决定交付质量。</p></div>
          </div>
        </section>

        <div className="course-stats home-container" aria-label="课程内容规模">
          <div><strong>{stats.stages}<small>个</small></strong><span>递进阶段</span></div>
          <div><strong>{stats.lessons}<small>课</small></strong><span>系统讲义与速记</span></div>
          <div><strong>{stats.experiments}<small>个</small></strong><span>网页内可运行实验</span></div>
          <div><strong>{stats.quizzes}<small>道</small></strong><span>公开自测与解析</span></div>
        </div>

        <section className="outcomes-section home-container home-section" id="outcomes" aria-labelledby="outcomes-title">
          <div className="section-editorial"><div><p className="home-eyebrow">WHAT YOU WILL BUILD</p><h2 id="outcomes-title">学到最后，<br />带走能交付的能力。</h2></div><p>目标是从“能把功能跑起来”，进阶到“能理解、验证并改进完整系统”。完成项目与考核后，用这些作品证明自己。</p></div>
          <div className="outcomes-grid">{outcomes.map((item, index) => <article className="outcome" key={item.title}><span className="outcome-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.detail}</p><div className="outcome-evidence"><Icon name="check" /><span>{item.evidence}</span></div></article>)}</div>
          <div className="audience-note"><span>适合这样的你</span><p>有前端或其他编程经验，正在用 AI 提高开发效率，希望进一步理解模型、服务、数据与产品如何一起工作。</p></div>
        </section>

        <section className="curriculum-section" id="curriculum" aria-labelledby="curriculum-title">
          <div className="home-container home-section">
            <div className="section-editorial"><div><p className="home-eyebrow">ONE PATH, EIGHT STAGES</p><h2 id="curriculum-title">知识有主线，<br />每一阶段都有作品。</h2></div><p>React / TypeScript 为主线，补齐 Python、SQL 与服务端基础。点击阶段查看课程，所有教材均可提前阅读。</p></div>
            <div className="route-grid">{stages.map(stage => <details className="route-stage" key={stage.id}><summary><span className="route-number">{stage.id}</span><span className="route-title">{stage.title}<small>{stage.lessons.length} 课 · 项目递进</small></span><Icon name="chevron" /></summary><div className="route-content"><p className="route-deliverable"><b>这一阶段交付</b>{stage.deliverable}</p><ol>{stage.lessons.map(lesson => <li key={lesson.id}><a href={'/learn.html#' + lesson.id + '/lecture'}><span>{lesson.id}</span>{lesson.title}<Icon name="arrow" /></a></li>)}</ol></div></details>)}</div>
            <a className="text-link" href={roadmap}>查看完整知识地图与验收要求 <Icon name="arrow" /></a>
          </div>
        </section>

        <section className="project-section home-container home-section" aria-labelledby="project-title">
          <div className="project-story"><p className="home-eyebrow">A PROJECT THAT GROWS WITH YOU</p><h2 id="project-title">一路做下来，<br />是一套完整的工作台。</h2><p>课程围绕“研发知识与工单 Agent 工作台”展开。你会逐步完成分诊、检索、工具调用与任务恢复，再用评测和执行记录检验它。</p><a className="text-link" href="/lab.html">进入项目实验台 <Icon name="arrow" /></a><span className="project-scope">实验台提供起点，核心实现由你在项目练习中完成。</span></div>
          <div className="project-flow" aria-label="毕业项目目标流程"><div className="project-flow-heading"><span className="home-status-dot" /> 贯穿八阶段的项目目标</div><ol>{['输入问题与工单', '检索有权限的知识', '生成方案与工具草稿', '人工确认后受限执行', '任务恢复、引用与评测'].map((text,index) => <li key={text}><span>0{index+1}</span><b>{text}</b>{index === 3 ? <small>人来判断</small> : <span className="flow-node" aria-hidden="true" />}</li>)}</ol><div className="project-stack"><span>React</span><span>TypeScript</span><span>Python</span><span>MCP</span><span>RAG</span></div></div>
        </section>

        <section className="prerequisites-section" id="prerequisites" aria-labelledby="prerequisites-title"><div className="home-container home-section">
          <div className="section-editorial"><div><p className="home-eyebrow">BEFORE YOU START</p><h2 id="prerequisites-title">不必先懂 AI，<br />带上这些基础就好。</h2></div><p>勾选已经熟悉的内容，做一次学习准备自查。不熟悉的基础可以先补一遍，再进入项目练习。</p></div>
          <div className="prerequisites-layout"><div className="foundation-list">{foundations.map((item,index) => <label className={'foundation-item' + (prepared.includes(item.id) ? ' checked' : '')} key={item.id}><input type="checkbox" checked={prepared.includes(item.id)} onChange={() => togglePrepared(item.id)} /><span className="foundation-number">0{index+1}</span><span className="foundation-copy"><b>{item.title}</b><span>{item.detail}</span></span><span className="foundation-check" aria-hidden="true"><Icon name="check" /></span></label>)}
          <div className="readiness-result" role="status"><b>准备自查 {prepared.length} / {foundations.length}</b><p>{remaining.length === 0 ? '网页学习基础已确认，可以从第一课开始；本地工具可在进阶时准备。' : prepared.length === 0 ? '勾选熟悉的基础，看看从哪里开始。' : '还可以先补：' + remaining.map(item => item.title).join('、') + '。'}</p>{prepared.length > 0 && remaining.length > 0 && <small>{remaining[0]?.review}</small>}</div></div>
          <aside className="readiness-aside"><div><span className="aside-label">可以在课程里学</span><h3>这些，不用提前精通。</h3><ul><li>模型机制、Token 与上下文</li><li>Prompt、工具调用、MCP 与 RAG</li><li>Python 后端桥接、SQL 与任务队列</li><li>评测、Trace、部署与工程取舍</li></ul></div><div className="environment-note"><span className="aside-label">环境准备</span><p>先学讲义和浏览器实验，只需现代浏览器。做本地项目时，再准备 Git、编辑器和 Node.js 24。</p><a href={firstLesson}>从第一课开始 <Icon name="arrow" /></a></div></aside></div>
        </div></section>

        <section className="method-section home-container home-section" aria-labelledby="method-title">
          <div className="section-editorial"><div><p className="home-eyebrow">HOW LEARNING WORKS HERE</p><h2 id="method-title">可以让 AI 帮你写，<br />理解和判断留给自己。</h2></div><p>不是按视频时长打卡。你可以学得很快，也可以直接提交证据，证明某个单元已经掌握。</p></div>
          <ol className="learning-method">{[{name:'读懂与实验',text:'讲义 → 先预测再运行 → 修改条件看反例。'}, {name:'项目与证据',text:stats.checkpoints+' 道开放题，配合项目、日志、评测与复盘。'}, {name:'交卷与答辩',text:'提交具体 commit 后，再安排新变式与本人解释。'}].map((item,index)=><li key={item.name}><span>0{index+1}</span><h3>{item.name}</h3><p>{item.text}</p></li>)}</ol>
          <div className="method-footnote">公开自测帮助复习，正式阶段考核另行进行。网页答案保存在本机，可以导出给老师评阅。</div>
        </section>

        <section className="author-section" id="author" aria-labelledby="author-title"><div className="home-container author-inner">
          <div className="author-identity"><span className="home-eyebrow">MEET THE BUILDER</span><div className="author-person"><a className="author-avatar" href={developer.github} target="_blank" rel="noopener noreferrer" aria-label="访问 Xeehho 的 GitHub 主页">{avatarFailed ? <span>X</span> : <img src={developer.avatar} alt="Xeehho 的 GitHub 头像" width="88" height="88" loading="lazy" onError={() => setAvatarFailed(true)} />}</a><div><h2 id="author-title">{developer.name}</h2><p>{developer.role}</p><a href={developer.github} target="_blank" rel="noopener noreferrer">@Xeehho <span aria-hidden="true">↗</span></a></div></div><span className="author-project-note">Agent Engineering Lab · 发起与维护</span></div>
          <div className="author-story"><h3>把探索，整理成一条可以实践的路。</h3>{developer.bio.map(text=><p key={text}>{text}</p>)}<a className="home-button author-star" href={developer.repository} target="_blank" rel="noopener noreferrer"><Icon name="star" /> 去 GitHub 支持这个项目 <span aria-hidden="true">↗</span></a><p className="author-invitation">如果对你有帮助，欢迎点个 Star，也欢迎带着具体问题一起完善课程。</p></div>
        </div></section>

        <section className="faq-section home-container home-section" id="faq" aria-labelledby="faq-title"><div><p className="home-eyebrow">A FEW THINGS TO KNOW</p><h2 id="faq-title">开始之前，<br />你可能还想知道。</h2></div><div className="faq-list">{faqs.map(item=><details key={item.question}><summary>{item.question}<Icon name="chevron" /></summary><p>{item.answer.replace('{experiments}', String(stats.experiments))}</p></details>)}</div></section>
        <section className="closing-section home-container"><span className="home-eyebrow">YOUR NEXT STEP</span><h2>从一个问题开始，<br />慢慢建立完整的判断。</h2><p>第一课：一次模型请求，怎样才算成功？</p><a className="home-button primary" href={firstLesson}>进入互动课堂 <Icon name="arrow" /></a></section>
      </main>
      <footer className="home-footer home-container"><div><b>Agent Engineering Lab</b><p>自主判断 · 可验证交付</p></div><nav aria-label="页脚导航"><a href={firstLesson}>互动课堂</a><a href="/lab.html">项目实验台</a><a href={developer.github} target="_blank" rel="noopener noreferrer">Xeehho <span aria-hidden="true">↗</span></a><a href={developer.repository} target="_blank" rel="noopener noreferrer">GitHub <Icon name="github" /></a></nav><span>项目预览版 · 开源准备中</span></footer>
    </div>
  );
}
