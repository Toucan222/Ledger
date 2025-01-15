/********************************************
  app.js => We'll rely on Babel at runtime
  thanks to <script type="text/babel" src="app.js">
*********************************************/
const { useState, useEffect, useRef } = React;

/** We'll store sample logos. 
 * If a ticker isn't found here, we fallback to a placeholder.
 */
const LOGOS = {
  "AAPL": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  "MSFT": "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg",
  "META": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Meta_Platforms_Inc._logo.svg",
  "TCKR04": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Visa_2021.svg",
  "TCKR05": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Procter_and_gamble_logo.svg",
  "TCKR06": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg",
  "TCKR07": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Johnson_%26_Johnson_logo.svg",
  "TCKR08": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Nvidia_logo.svg",
  "TCKR09": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_N_logo.svg",
  "TCKR10": "https://upload.wikimedia.org/wikipedia/commons/3/33/Coca-Cola_logo.svg",
};

/** We'll fetch data from local data.json. 
 *  If you want to fetch from GitHub, replace with your link:
 *  "https://raw.githubusercontent.com/YourUserName/YourRepoName/main/data.json"
 */
const DATA_URL = "./data.json"; // local file in same folder

function App(){
  const cardRef = useRef(null);

  /** We'll load companies from data.json */
  const [companies, setCompanies] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [bannerText, setBannerText] = useState("");

  // Overlay
  const [showCompanies, setShowCompanies] = useState(false);

  // Scoreboard vs Q&A
  const [qaMode, setQaMode] = useState(false);

  // Fetch from data.json
  useEffect(()=>{
    fetch(DATA_URL)
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        if(data.length>0) {
          setSelectedStock(data[0]); // default to first
        }
      })
      .catch(err => {
        console.error("Error fetching data.json:", err);
      });
  },[]);

  // Update scroller text
  useEffect(()=>{
    if(!selectedStock) return;
    let facts = selectedStock.facts || [];
    let repeated = facts.join(" *** ") + " *** " + facts.join(" *** ");
    setBannerText(repeated);
  },[selectedStock]);

  function handleShare(){
    if(selectedStock){
      alert(`Link => ${selectedStock.ticker}`);
    }
  }
  function handleDownload(){
    if(!window.html2canvas || !window.jspdf){
      alert("Need html2canvas + jsPDF for PDF!");
      return;
    }
    window.html2canvas(cardRef.current).then(canvas=>{
      let data = canvas.toDataURL("image/png");
      let { jsPDF } = window.jspdf;
      let pdf = new jsPDF("l","pt","a4");
      let w = pdf.internal.pageSize.getWidth();
      pdf.addImage(data,"PNG",0,0,w,0);
      let fileName = selectedStock ? `${selectedStock.ticker}_Scorecard.pdf` : "Ledger_Scorecard.pdf";
      pdf.save(fileName);
    });
  }
  function openCompanies(){ setShowCompanies(true); }
  function closeCompanies(){ setShowCompanies(false); }
  function selectCompany(co){
    setSelectedStock(co);
    setShowCompanies(false);
    setQaMode(false);
  }
  function toggleQaMode(){
    setQaMode(!qaMode);
  }

  if(!selectedStock){
    return (
      <div style={{color:"#333", fontSize:"1rem"}}>
        Loading Data ...
      </div>
    );
  }

  return (
    <div className="card-container" ref={cardRef}>
      <div className="top-bar">
        <div className="bar-left">
          <div className="bar-left-text">Ledger, by StockSentinel</div>
        </div>
        <div className="bar-right">
          <button className="bar-icon-btn" onClick={handleShare} title="Link">🔗</button>
          <button className="bar-icon-btn" onClick={handleDownload} title="Download">⬇</button>
          {!qaMode && (
            <button className="bar-icon-btn" onClick={toggleQaMode} title="Questions">❓</button>
          )}
          {qaMode && (
            <button className="bar-icon-btn" onClick={toggleQaMode} title="Scoreboard">📈</button>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="left-col">
          <ProfileCard stock={selectedStock} onChangeCompany={openCompanies}/>
          <PodcastCard/>
          <AnnualCard stock={selectedStock}/>
        </div>
        <div className="right-col">
          {qaMode ? (
            <QACards stock={selectedStock}/>
          ) : (
            <ScoreTable stock={selectedStock}/>
          )}
        </div>
      </div>

      {/* Fact scroller => bottom => auto scroll */}
      <div style={{
        position:"absolute",
        bottom:0,
        left:0,
        width:"100%",
        height:"32px",
        background:"#ccc",
        color:"#000",
        overflow:"hidden"
      }}>
        <div style={{
          position:"absolute",
          whiteSpace:"nowrap",
          fontSize:"0.9rem",
          fontWeight:600,
          lineHeight:"32px",
          animation:"factScroll 150s linear infinite",
          left:"100%"
        }}>
          {bannerText}
        </div>
      </div>

      {showCompanies &&
        <CompaniesOverlay
          companies={companies}
          onSelect={selectCompany}
          onClose={closeCompanies}
        />
      }
    </div>
  );
}

/** Profile => shows the selected stock’s info. */
function ProfileCard({ stock, onChangeCompany }){
  let logo = LOGOS[stock.ticker] || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
  return (
    <div className="profile-card" onClick={onChangeCompany}>
      <div className="hover-bubble">Click to Change Company</div>
      <img className="profile-img" src={logo} alt="logo"/>
      <div className="profile-info">
        <div className="profile-title">{stock.name}</div>
        <div style={{fontWeight:600, color: stock.yoy2024>0?"#44cc44":"#cc4444"}}>
          2024: {stock.yoy2024>0? `+${stock.yoy2024(1)}%` : `${stock.yoy2024(1)}%`}
        </div>
        <div className="profile-details">
          <div>CEO: {stock.ceo}</div>
          <div>HQ: {stock.hq}</div>
          <div>Industry: {stock.industry}</div>
        </div>
      </div>
    </div>
  );
}

/** Podcast => same logic from previous. */
function PodcastCard(){
  const audioRef= useRef(null);
  const [playing,setPlaying]= useState(false);

  function handlePlay(){ setPlaying(true); }
  function handlePause(){ setPlaying(false); }
  function setSpeed(sp){
    if(audioRef.current) audioRef.current.playbackRate= sp;
  }

  return (
    <div className="podcast-card">
      <div className={`podcast-orb ${playing?"playing":""}`}></div>
      <div className="podcast-btn-row">
        <span style={{fontSize:"0.8rem",fontWeight:600}}>Speed:</span>
        <button className="podcast-speed-btn" onClick={()=>setSpeed(1)}>1x</button>
        <button className="podcast-speed-btn" onClick={()=>setSpeed(1.5)}>1.5x</button>
        <button className="podcast-speed-btn" onClick={()=>setSpeed(2)}>2x</button>
      </div>
      <audio
        ref={audioRef}
        className="podcast-audio"
        controls
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handlePause}
      >
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" type="audio/mpeg"/>
      </audio>
    </div>
  );
}

/** Annual => scenario with 4 bullet points => 50% smaller icons. */
function AnnualCard({ stock }){
  const [pick,setPick]= useState("");
  let sc = stock.scenario || {};

  let bearBullets= sc.bearBullets || ["Bear #1","Bear #2","Bear #3","Bear #4"];
  let baseBullets= sc.baseBullets || ["Base #1","Base #2","Base #3","Base #4"];
  let bullBullets= sc.bullBullets || ["Bull #1","Bull #2","Bull #3","Bull #4"];

  function pickScenario(which){
    setPick(which);
  }

  function renderIcon(which, iconEmoji){
    let val= sc[which] || 0;
    let sign= val>0 ? "+" : "";
    let highlight= (pick===which);
    let style= highlight? {transform:"scale(1.1)", boxShadow:"0 0 6px rgba(0,0,0,0.3)"}:{};
    return (
      <div className={`icon-circle ${which==="bear"?"bear-icon": which==="bull"?"bull-icon":"base-icon"}`}
           style={style}
           onClick={()=>pickScenario(which)}>
        <div className="icon-top-value">{sign}{val}%</div>
        {iconEmoji}
      </div>
    );
  }

  let chosen= pick || "base";
  let bulletClass= (chosen==="bear")?"scenario-bullet-bear": (chosen==="bull")?"scenario-bullet-bull":"scenario-bullet-base";
  let lines= chosen==="bear"? bearBullets : chosen==="bull"? bullBullets : baseBullets;

  return (
    <div className="annual-card">
      <div className="icon-row">
        {renderIcon("bear","🐻")}
        {renderIcon("base","O")}
        {renderIcon("bull","🚀")}
      </div>
      <div className="scenario-bullet-container">
        {lines.map((l,i)=>(
          <div key={i} className={`scenario-bullet-box ${bulletClass}`}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Scoreboard => flipping each row => no changes. */
function ScoreTable({ stock }){
  let scoreboard= stock.scoreboard || [];
  scoreboard= scoreboard.slice().sort((a,b)=> b.value - a.value);

  const [flips,setFlips]= useState(new Set());

  function flipRow(i){
    let newSet= new Set(flips);
    newSet.has(i)? newSet.delete(i) : newSet.add(i);
    setFlips(newSet);
  }

  return (
    <table className="scoreboard-table">
      <tbody>
        {scoreboard.map((item,i)=>{
          let flipped= flips.has(i);
          let val= item.value || 5;
          let hue= (val/10)*120;
          let w= (val/10)*100 + "%";
          let barColor= `hsl(${hue},80%,50%)`;
          return (
            <tr key={i} 
                className={flipped?"flip-active":""}
                onClick={()=>flipRow(i)}>
              <td>
                <div className="row-content">
                  <div className="row-front">
                    <span className="score-title">{item.name}</span>
                    <span className="score-value-big">{val}</span>
                    <div className="score-bar-bg">
                      <div className="score-bar-fill" style={{width:w, background:barColor}}/>
                    </div>
                  </div>
                  <div className="row-back">
                    {item.desc}
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** QACards => flipping 5 Q/A on click. */
function QACards({ stock }){
  const [flipQs,setFlipQs]= useState(new Set());
  let qa= stock.qa || [];

  function flipRow(i){
    let newSet= new Set(flipQs);
    newSet.has(i)? newSet.delete(i): newSet.add(i);
    setFlipQs(newSet);
  }

  return (
    <table className="qa-table">
      <tbody>
        {qa.map((item,i)=>{
          let flipped= flipQs.has(i);
          return (
            <tr key={i}
                className={flipped?"qa-flip-active":""}
                onClick={()=>flipRow(i)}>
              <td>
                <div className="qa-row-content">
                  <div className="qa-row-front">
                    <strong>Q{(i+1)}: </strong>{item.q}
                  </div>
                  <div className="qa-row-back">
                    {item.a}
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** CompaniesOverlay => same filter+sort => entire row clickable => user picks new co. */
function CompaniesOverlay({ companies, onSelect, onClose }){
  const [bearFilter,setBearFilter]= useState(null);
  const [baseFilter,setBaseFilter]= useState(null);
  const [bullFilter,setBullFilter]= useState(null);
  const [avgFilter,setAvgFilter]= useState(null);

  const [sortCol,setSortCol]= useState(null);
  const [sortDir,setSortDir]= useState("desc");
  const [tableData,setTableData]= useState(companies);

  useEffect(()=>{ doFilterAndSort(); },[bearFilter,baseFilter,bullFilter,avgFilter,sortCol,sortDir,companies]);

  function doFilterAndSort(){
    let arr=[...companies];
    if(bearFilter!=null){
      arr= arr.filter(c=> c.scenario?.bear>=bearFilter);
    }
    if(baseFilter!=null){
      arr= arr.filter(c=> c.scenario?.base>=baseFilter);
    }
    if(bullFilter!=null){
      arr= arr.filter(c=> c.scenario?.bull>=bullFilter);
    }
    if(avgFilter!=null){
      arr= arr.filter(c=>{
        let sc= c.scoreboard || [];
        let sum= sc.reduce((acc,x)=>acc+x.value,0);
        let avg= sc.length ? sum/sc.length : 0;
        return avg>=avgFilter;
      });
    }

    if(sortCol){
      arr.sort((a,b)=>{
        let valA= getVal(a,sortCol);
        let valB= getVal(b,sortCol);
        if(sortDir==="asc") return valA - valB;
        else return valB - valA;
      });
    }
    setTableData(arr);
  }

  function getVal(co,col){
    if(col==="bear") return co.scenario?.bear||0;
    if(col==="base") return co.scenario?.base||0;
    if(col==="bull") return co.scenario?.bull||0;
    if(col==="avg"){
      let sc= co.scoreboard||[];
      let sum= sc.reduce((acc,x)=>acc+x.value,0);
      return sc.length? sum/sc.length : 0;
    }
    return 0;
  }

  function toggleSort(column){
    if(sortCol===column){
      setSortDir(sortDir==="asc" ? "desc" : "asc");
    } else {
      setSortCol(column);
      setSortDir("desc");
    }
  }

  return (
    <div className="back-panel" style={{display:"flex", flexDirection:"column"}}>
      <div style={{
        padding:"6px",
        borderBottom:"1px solid #ccc",
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center"
      }}>
        <h4>Select a Company</h4>
        <button onClick={onClose}>Close</button>
      </div>
      <div style={{overflow:"auto", flex:1, padding:"8px", display:"flex", flexDirection:"column", gap:"10px"}}>
        <div className="company-filter-bar">
          <label>Bear ≥</label>
          <input type="number" style={{width:"60px"}} value={bearFilter??""}
                 onChange={e=> setBearFilter(e.target.value? parseFloat(e.target.value):null)}/>
          <label>Base ≥</label>
          <input type="number" style={{width:"60px"}} value={baseFilter??""}
                 onChange={e=> setBaseFilter(e.target.value? parseFloat(e.target.value):null)}/>
          <label>Bull ≥</label>
          <input type="number" style={{width:"60px"}} value={bullFilter??""}
                 onChange={e=> setBullFilter(e.target.value? parseFloat(e.target.value):null)}/>
          <label>Avg ≥</label>
          <input type="number" style={{width:"60px"}} value={avgFilter??""}
                 onChange={e=> setAvgFilter(e.target.value? parseFloat(e.target.value):null)}/>
        </div>
        <table className="company-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Ticker</th>
              <th onClick={()=>toggleSort("bear")}>Bear</th>
              <th onClick={()=>toggleSort("base")}>Base</th>
              <th onClick={()=>toggleSort("bull")}>Bull</th>
              <th onClick={()=>toggleSort("avg")}>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((co,i)=>{
              let sc= co.scoreboard||[];
              let sum= sc.reduce((acc,x)=> acc+x.value,0);
              let scAvg= sc.length? (sum/sc.length).toFixed(2): "0.00";
              let logo= LOGOS[co.ticker] || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";

              return (
                <tr key={co.ticker} className="company-row" onClick={()=>onSelect(co)}>
                  <td>
                    <img src={logo} alt="logo" style={{width:"40px",height:"40px"}} />
                  </td>
                  <td>{co.ticker}</td>
                  <td>{co.scenario?.bear||0}</td>
                  <td>{co.scenario?.base||0}</td>
                  <td>{co.scenario?.bull||0}</td>
                  <td>{scAvg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Finally, mount the <App /> into #root. */
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
