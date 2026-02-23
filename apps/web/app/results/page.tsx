"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore, type ArchitectureOption } from "@/lib/store";
import { createRepo } from "@/lib/api";
import AppLayout from "@cloudscape-design/components/app-layout";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Tabs from "@cloudscape-design/components/tabs";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Badge from "@cloudscape-design/components/badge";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Alert from "@cloudscape-design/components/alert";
import Input from "@cloudscape-design/components/input";
import FormField from "@cloudscape-design/components/form-field";
import Toggle from "@cloudscape-design/components/toggle";
import Modal from "@cloudscape-design/components/modal";
import ExpandableSection from "@cloudscape-design/components/expandable-section";

const COMPLEXITY_COLOR: Record<string, "blue" | "green" | "red"> = {
  low: "green",
  medium: "blue",
  high: "red",
};

const RISK_TYPE: Record<string, "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

function StackCard({ option, selected, onSelect }: { option: ArchitectureOption; selected: boolean; onSelect: () => void }) {
  return (
    <Container
      header={
        <Header
          variant="h3"
          actions={
            <Button variant={selected ? "primary" : "normal"} onClick={onSelect}>
              {selected ? "Selected" : "Select"}
            </Button>
          }
        >
          <SpaceBetween direction="horizontal" size="xs">
            {option.name}
            <Badge color={COMPLEXITY_COLOR[option.complexity]}>{option.complexity} complexity</Badge>
          </SpaceBetween>
        </Header>
      }
    >
      <SpaceBetween size="m">
        <Box color="text-body-secondary">{option.best_for}</Box>
        <Box variant="awsui-key-label">Monthly cost: {option.monthly_cost_estimate}</Box>

        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween size="xs">
            <Box variant="h4" color="text-status-success">Pros</Box>
            {option.pros.map((p, i) => (
              <Box key={i}>
                <span aria-hidden="true">✓ </span>{p}
              </Box>
            ))}
          </SpaceBetween>
          <SpaceBetween size="xs">
            <Box variant="h4" color="text-status-error">Cons</Box>
            {option.cons.map((c, i) => (
              <Box key={i}>
                <span aria-hidden="true">✗ </span>{c}
              </Box>
            ))}
          </SpaceBetween>
        </ColumnLayout>

        <SpaceBetween size="xs">
          <Box variant="h4">Stack</Box>
          <ColumnLayout columns={2} variant="text-grid">
            {Object.entries(option.stack).map(([layer, tech]) => (
              <Box key={layer}>
                <span className="awsui-visually-hidden">{layer}: </span>
                <span aria-hidden="true"><strong>{layer}:</strong> </span>
                {tech}
              </Box>
            ))}
          </ColumnLayout>
        </SpaceBetween>
      </SpaceBetween>
    </Container>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { plan, planId, githubToken, setGithubToken, setRepoUrl, repoUrl } = useWizardStore();
  const [selectedOption, setSelectedOption] = useState<ArchitectureOption | null>(plan?.recommended ?? null);
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [includeSop, setIncludeSop] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [repoError, setRepoError] = useState("");
  const [showTokenModal, setShowTokenModal] = useState(false);

  if (!plan) {
    return (
      <Alert type="warning" header="No plan found">
        <Button onClick={() => router.push("/questionnaire")}>Start over</Button>
      </Alert>
    );
  }

  const allOptions = [plan.recommended, ...plan.alternatives];

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-plan-${planId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = [
      `# Project Plan`,
      ``,
      `## Recommended: ${plan.recommended.name}`,
      ``,
      `**Cost:** ${plan.recommended.monthly_cost_estimate}`,
      `**Complexity:** ${plan.recommended.complexity}`,
      ``,
      `### Stack`,
      ...Object.entries(plan.recommended.stack).map(([k, v]) => `- **${k}:** ${v}`),
      ``,
      `## Review Findings`,
      ...plan.review_findings.map((f) => [
        `### ${f.category} (${f.risk_level} risk)`,
        ...f.findings.map((x) => `- ${x}`),
      ].join("\n")),
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-plan-${planId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateRepo = async () => {
    if (!repoName.trim()) { setRepoError("Repo name is required"); return; }
    const token = githubToken || tokenInput || undefined;
    if (process.env.NEXT_PUBLIC_GITHUB_TOKEN_REQUIRED === "true" && !token) {
      setShowTokenModal(true);
      return;
    }
    setCreating(true);
    setRepoError("");
    try {
      if (tokenInput) setGithubToken(tokenInput);
      const result = await createRepo(planId!, repoName.trim(), isPrivate, includeSop, token);
      setRepoUrl(result.repo_url);
    } catch (e) {
      setRepoError(e instanceof Error ? e.message : "Failed to create repo");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div id="top-nav" style={{ position: "sticky", top: 0, zIndex: 1002 }}>
        <TopNavigation identity={{ href: "/", title: "Project Planner AI" }} />
      </div>

      <AppLayout
        headerSelector="#top-nav"
        navigationHide
        toolsHide
        content={
          <ContentLayout
            header={
              <Header
                variant="h1"
                description={`Plan ID: ${planId}`}
                actions={
                  <SpaceBetween direction="horizontal" size="s">
                    <Button onClick={handleExportMarkdown} iconName="download">Export MD</Button>
                    <Button onClick={handleExportJson} iconName="download">Export JSON</Button>
                    <Button onClick={() => router.push("/questionnaire")}>New plan</Button>
                  </SpaceBetween>
                }
              >
                Your project plan
              </Header>
            }
          >
            <SpaceBetween size="m">
              {plan.cost_estimate_ai > 0 && (
                <Box color="text-body-secondary" fontSize="body-s">
                  AI generation cost: ~${plan.cost_estimate_ai.toFixed(4)} USD
                </Box>
              )}
            </SpaceBetween>

            <Tabs
              tabs={[
                {
                  label: "Architecture options",
                  id: "arch",
                  content: (
                    <SpaceBetween size="l">
                      {allOptions.map((opt, i) => (
                        <StackCard
                          key={i}
                          option={opt}
                          selected={selectedOption?.name === opt.name}
                          onSelect={() => setSelectedOption(opt)}
                        />
                      ))}
                    </SpaceBetween>
                  ),
                },
                {
                  label: "Review findings",
                  id: "review",
                  content: (
                    <SpaceBetween size="m">
                      {plan.review_findings.map((f) => (
                        <ExpandableSection
                          key={f.iteration}
                          headerText={
                            <SpaceBetween direction="horizontal" size="s">
                              <StatusIndicator type={RISK_TYPE[f.risk_level]}>
                                {f.category}
                              </StatusIndicator>
                            </SpaceBetween>
                          }
                        >
                          <SpaceBetween size="s">
                            {f.findings.length > 0 && (
                              <SpaceBetween size="xs">
                                <Box variant="h4">Findings</Box>
                                {f.findings.map((x, i) => (
                                  <Box key={i}>
                                    <span aria-hidden="true">• </span>{x}
                                  </Box>
                                ))}
                              </SpaceBetween>
                            )}
                            {f.recommendations.length > 0 && (
                              <SpaceBetween size="xs">
                                <Box variant="h4">Recommendations</Box>
                                {f.recommendations.map((x, i) => (
                                  <Box key={i}>
                                    <span aria-hidden="true">→ </span>{x}
                                  </Box>
                                ))}
                              </SpaceBetween>
                            )}
                          </SpaceBetween>
                        </ExpandableSection>
                      ))}
                    </SpaceBetween>
                  ),
                },
                {
                  label: "Bootstrap repo",
                  id: "github",
                  content: (
                    <Container header={<Header variant="h2">Create GitHub repository</Header>}>
                      <SpaceBetween size="l">
                        {repoUrl ? (
                          <Alert type="success" header="Repository created">
                            <SpaceBetween direction="horizontal" size="s">
                              <Box>{repoUrl}</Box>
                              <Button href={repoUrl} target="_blank" iconAlign="right" iconName="external">
                                Open on GitHub
                              </Button>
                            </SpaceBetween>
                          </Alert>
                        ) : (
                          <>
                            {repoError && <Alert type="error">{repoError}</Alert>}

                            <FormField label="Repository name" description="Lowercase letters, numbers, and hyphens only">
                              <Input
                                value={repoName}
                                onChange={({ detail }) => setRepoName(detail.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                                placeholder="my-project"
                              />
                            </FormField>

                            <SpaceBetween size="s">
                              <Toggle checked={isPrivate} onChange={({ detail }) => setIsPrivate(detail.checked)}>
                                Private repository
                              </Toggle>
                              <Toggle checked={includeSop} onChange={({ detail }) => setIncludeSop(detail.checked)}>
                                Include AI_DEVELOPMENT_SOP.md
                              </Toggle>
                            </SpaceBetween>

                            {process.env.NEXT_PUBLIC_GITHUB_TOKEN_REQUIRED === "true" && !githubToken && (
                              <FormField
                                label="GitHub Personal Access Token"
                                description='Needs "repo" scope. Used once, never stored.'
                              >
                                <Input
                                  type="password"
                                  value={tokenInput}
                                  onChange={({ detail }) => setTokenInput(detail.value)}
                                  placeholder="ghp_..."
                                />
                              </FormField>
                            )}

                            <Button
                              variant="primary"
                              onClick={handleCreateRepo}
                              loading={creating}
                              disabled={!repoName.trim()}
                            >
                              Create repository
                            </Button>
                          </>
                        )}
                      </SpaceBetween>
                    </Container>
                  ),
                },
              ]}
            />
          </ContentLayout>
        }
      />

      <Modal
        visible={showTokenModal}
        onDismiss={() => setShowTokenModal(false)}
        header="GitHub token required"
        footer={
          <SpaceBetween direction="horizontal" size="s">
            <Button onClick={() => setShowTokenModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => { setShowTokenModal(false); handleCreateRepo(); }}
              disabled={!tokenInput}
            >
              Continue
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <Box>Enter a GitHub Personal Access Token with <strong aria-label="repo scope">repo</strong> scope to create the repository.</Box>
          <FormField label="Personal Access Token">
            <Input
              type="password"
              value={tokenInput}
              onChange={({ detail }) => setTokenInput(detail.value)}
              placeholder="ghp_..."
            />
          </FormField>
          <Box color="text-body-secondary" fontSize="body-s">
            Token is used once for this request and never stored or logged.
          </Box>
        </SpaceBetween>
      </Modal>
    </>
  );
}
