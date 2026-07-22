import type { ReactNode } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useTranslation } from "@shared/i18n/useTranslation";
import s from "./LegalPage.module.css";

const DOC_KEYS: Record<string, string> = {
  terms: "legal.terms",
  privacy: "legal.privacy",
};

const renderInline = (text: string): ReactNode[] =>
  text
    .split(/\*\*(.*?)\*\*/g)
    .map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
    );

const renderContent = (md: string): ReactNode[] => {
  const lines = md.trim().split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = (): void => {
    if (listItems.length === 0) return;
    const items = listItems;
    blocks.push(
      <ul key={`ul-${key++}`}>
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={`h-${key++}`}>{line.slice(3)}</h2>);
      continue;
    }
    blocks.push(<p key={`p-${key++}`}>{renderInline(line)}</p>);
  }
  flushList();

  return blocks;
};

export const LegalPage = () => {
  const { t } = useTranslation();
  const { doc } = useParams();
  const navigate = useNavigate();
  const docKey = doc ? DOC_KEYS[doc] : undefined;

  if (!docKey) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={s['page']}>
      <div className={s['header']}>
        <div className={s['headerInner']}>
          <button className={s['back']} onClick={() => { void navigate(-1); }} aria-label={t("legal.backLabel")}>
            <ArrowLeftIcon size={20} weight="bold" />
          </button>
          <h1 className={s['title']}>{t(`${docKey}.title`)}</h1>
        </div>
      </div>
      <div className={s['body']}>{renderContent(t(`${docKey}.body`))}</div>
    </div>
  );
};
