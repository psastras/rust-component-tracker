import type { NextPage } from "next";
import * as fs from "fs";
import moment from "moment";
import {
  DetailsList,
  DetailsRow,
  getTheme,
  IColumn,
  SelectionMode,
} from "@fluentui/react";
import { execSync } from "child_process";
import {
  ComboBox,
  IComboBox,
  IComboBoxOption,
  IComboBoxStyles,
  SelectableOptionMenuItemType,
  Stack,
} from "@fluentui/react";
import { useRouter } from "next/router";

const theme = getTheme();
import React from "react";

// Optional styling to make the example look nicer
const comboBoxStyles: Partial<IComboBoxStyles> = { root: { minWidth: 400 } };

export async function getStaticProps({ params }: any) {
  const endDate = moment();
  let manifests: any = {};
  const uniqueTargets = new Set<String>();
  const uniqueComponents = new Set<String>();
  const reduceManifest = (manifest: any): any => {
    return Object.keys(manifest["pkg"]).reduce(
      (prev, component) => {
        const targets = Object.keys(manifest["pkg"][component]["target"]);
        uniqueComponents.add(component);
        return {
          ...prev,
          [component]: targets.reduce((prev, target) => {
            uniqueTargets.add(target);
            return {
              ...prev,
              [target]:
                manifest["pkg"][component]["target"][target]["available"],
            };
          }, {}),
        };
      },
      {
        // _renames: { ...manifest["renames"] },
      }
    );
  };
  for (
    let date = moment().subtract(process.env.DAYS || 1, "days");
    date.isBefore(endDate);
    date = date.add(1, "d")
  ) {
    const dateString = date.format("YYYY-MM-DD");
    const manifestPath = `data/rust-forge/manifests/${dateString}/channel-rust-nightly.json`;
    if (fs.existsSync(manifestPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(manifestPath) as any);
        manifests[dateString] = reduceManifest(json);
      } catch (e) {
        fs.rmSync(`data/rust-forge/manifests/${dateString}`, {
          recursive: true,
        });
        manifests[dateString] = {};
        console.error(e);
      }
    } else {
      fs.mkdirSync(`data/rust-forge/manifests/${dateString}`, {
        recursive: true,
      });
      try {
        execSync(
          `curl -sSL https://static.rust-lang.org/dist/${dateString}/channel-rust-nightly.toml | yj -tj > ${manifestPath}`
        );
        const json = JSON.parse(fs.readFileSync(manifestPath) as any);
        manifests[dateString] = reduceManifest(json);
      } catch (e) {
        fs.rmSync(`data/rust-forge/manifests/${dateString}`, {
          recursive: true,
        });
        manifests[dateString] = {};
        console.error(e);
      }
    }
  }

  return {
    props: {
      manifests,
      targets: Array.from(uniqueTargets),
      components: Array.from(uniqueComponents),
    },
  };
}

function _renderRow(props: any, selectedComponents: string[]) {
  if (props) {
    const allAvailable = selectedComponents
      .map((component) => props.item[component])
      .every((v) => v === true);
    if (allAvailable) {
      return (
        <DetailsRow
          {...props}
          styles={{
            root: { color: theme.palette.themePrimary },
          }}
        />
      );
    } else {
      return <DetailsRow {...props} />;
    }
  }
  return null;
}

function _renderItemColumn(item: any, index: number, column: IColumn) {
  const fieldContent = item[column.fieldName as any] as string;
  if (column.key.startsWith("component")) {
    switch (fieldContent.toString()) {
      case "true":
        return <span>{"yes"}</span>;
      default:
        return <span style={{ color: theme.palette.orange }}>{"no"}</span>;
    }
  } else {
    return <span>{fieldContent.toString()}</span>;
  }
}

const Manifest: NextPage = ({ manifests, targets, components }: any) => {
  const router = useRouter();
  const [targetSelectedKeys, setTargetSelectedKeys] = React.useState<string[]>(
    [
      router.query?.targets || [
        "aarch64-unknown-linux-gnu",
        "i686-pc-windows-gnu",
        "i686-pc-windows-msvc",
        "i686-unknown-linux-gnu",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-gnu",
        "x86_64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
      ],
    ].flat()
  );
  React.useEffect(() => {
    setTargetSelectedKeys([router.query?.targets || targetSelectedKeys].flat());
  }, [router.query?.targets]);

  const [componentSelectedKeys, setComponentSelectedKeys] = React.useState<
    string[]
  >(
    [
      router.query?.components || [
        "cargo",
        "clippy-preview",
        "llvm-tools-preview",
        "miri-preview",
        "reproducible-artifacts",
        "rls-preview",
        "rust",
        "rust-analysis",
        "rust-analyzer-preview",
        "rust-docs",
        "rust-std",
        "rustc",
        "rustc-dev",
        "rustc-docs",
        "rustfmt-preview",
      ],
    ].flat()
  );
  React.useEffect(() => {
    setComponentSelectedKeys(
      [router.query?.components || componentSelectedKeys].flat()
    );
  }, [router.query?.components]);

  const items = Object.keys(manifests)
    .sort()
    .reverse()
    .map((date, i) => {
      return targetSelectedKeys.map((target: string) => {
        return {
          key: `${date}-${target}`,
          target,
          date,
          ...components.reduce((prev: any, component: string) => {
            // const mappedComponent =
            //   manifests[date]?.["_renames"]?.[component]?.["to"] || component;
            return {
              [component]: manifests[date]?.[component]?.[target] || "no",
              ...prev,
            };
          }, {}),
        };
      });
    })
    .flat();
  const groups = Object.keys(manifests)
    .sort()
    .reverse()
    .map((date, i) => {
      return {
        key: date,
        name: date,
        startIndex: i * targetSelectedKeys.length,
        count: targetSelectedKeys.length,
        level: 0,
      };
    });

  const targetOptions = targets.map((target: string) => {
    return {
      key: target,
      text: target,
    };
  });

  const targetOnChange = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const selected = option?.selected;
    if (option) {
      const updatedKeys = selected
        ? [...targetSelectedKeys, option!.key as string]
        : targetSelectedKeys.filter((k) => k !== option.key);
      router.push(
        {
          pathname: "/",
          query: {
            targets: updatedKeys.sort(),
            components: componentSelectedKeys.sort(),
          },
        },
        undefined,
        { shallow: true }
      );
      setTargetSelectedKeys(updatedKeys.sort());
    }
  };

  const componentOptions = components.map((component: string) => {
    return {
      key: component,
      text: component,
    };
  });
  const componentOnChange = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const selected = option?.selected;
    if (option) {
      const updatedKeys = selected
        ? [...componentSelectedKeys, option!.key as string]
        : componentSelectedKeys.filter((k) => k !== option.key);
      router.push(
        {
          pathname: "/",
          query: {
            targets: targetSelectedKeys.sort(),
            components: updatedKeys.sort(),
          },
        },
        undefined,
        { shallow: true }
      );
      setComponentSelectedKeys(updatedKeys.sort());
    }
  };

  const columns = [
    {
      key: "date",
      name: "Date",
      fieldName: "target",
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
    },
    ...componentSelectedKeys.map((component: string) => {
      return {
        key: `component-${component}`,
        name: component,
        fieldName: component,
        minWidth: 0,
        maxWidth: 100,
      };
    }),
  ];

  return (
    <Stack verticalFill>
      <Stack tokens={{ childrenGap: 15 }} horizontal>
        <ComboBox
          label="Targets"
          allowFreeform={true}
          autoComplete="on"
          multiSelect
          options={targetOptions}
          selectedKey={targetSelectedKeys}
          // eslint-disable-next-line react/jsx-no-bind
          onChange={targetOnChange}
          styles={comboBoxStyles}
        />
        <ComboBox
          label="Components"
          multiSelect
          options={componentOptions}
          selectedKey={componentSelectedKeys}
          // eslint-disable-next-line react/jsx-no-bind
          onChange={componentOnChange}
          styles={comboBoxStyles}
        />
      </Stack>
      <DetailsList
        items={items}
        groups={groups}
        columns={columns}
        onRenderItemColumn={_renderItemColumn as any}
        onRenderRow={(props) => _renderRow(props, componentSelectedKeys)}
        ariaLabelForSelectionColumn="Toggle selection"
        checkButtonAriaLabel="select row"
        checkButtonGroupAriaLabel="select section"
        selectionMode={SelectionMode.none}
        // onRenderDetailsHeader={this._onRenderDetailsHeader}
        groupProps={{
          showEmptyGroups: true,
        }}
        // onRenderItemColumn={this._onRenderColumn}
        compact={true}
      />
    </Stack>
  );
};

export default Manifest;
