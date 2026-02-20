import "./Header.css";

function shortAddress(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Header({ account, onConnect }) {
  return (
    <header className="header">
      <div className="header__logo">
        <span className="header__gem">◆</span>
        <span className="header__name">Arkenstone</span>
      </div>

      <div className="header__right">
        {account ? (
          <div className="header__account">
            <span className="header__dot" />
            {shortAddress(account)}
          </div>
        ) : (
          <button className="btn btn--primary" onClick={onConnect}>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
