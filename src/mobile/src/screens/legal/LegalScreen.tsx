import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/ui";
import { t } from "@/i18n";

export type LegalDoc = "terms" | "privacy";

interface LegalScreenProps {
  doc: string;
}

const isLegalDoc = (value: string): value is LegalDoc =>
  value === "terms" || value === "privacy";

interface Line {
  key: string;
  type: "h2" | "text";
  content: string;
}

const parseMarkdown = (body: string): Line[] =>
  body
    .split("\n")
    .map((raw, index) => {
      const line = raw.trim();
      if (line.startsWith("## ")) {
        return { key: `l${index}`, type: "h2" as const, content: line.slice(3).trim() };
      }
      return { key: `l${index}`, type: "text" as const, content: line };
    })
    .filter((line) => line.content.length > 0);

const stripEmphasis = (text: string): string => text.replace(/\*\*/g, "");

export function LegalScreen({ doc }: LegalScreenProps): React.JSX.Element {
  if (!isLegalDoc(doc)) {
    return (
      <Screen>
        <EmptyState
          icon="document-outline"
          title={t("common.errors.pageNotFound")}
        />
      </Screen>
    );
  }

  const title = t(`legal.${doc}.title`);
  const body = t(`legal.${doc}.body`);
  const lines = parseMarkdown(body);

  return (
    <Screen scroll>
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      <View style={styles.body}>
        {lines.map((line) =>
          line.type === "h2" ? (
            <AppText key={line.key} variant="heading" style={styles.heading}>
              {stripEmphasis(line.content)}
            </AppText>
          ) : (
            <AppText key={line.key} variant="body" color="secondary" style={styles.paragraph}>
              {stripEmphasis(line.content)}
            </AppText>
          ),
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  body: {
    gap: 10,
  },
  heading: {
    marginTop: 12,
  },
  paragraph: {
    lineHeight: 22,
  },
});
