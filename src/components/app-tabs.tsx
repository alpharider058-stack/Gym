import { NativeTabs } from "expo-router/unstable-native-tabs";

import { LUXURY } from "@/constants/theme";

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={LUXURY.ink}
      indicatorColor={LUXURY.gold}
      labelStyle={{ selected: { color: LUXURY.gold, fontWeight: "700" } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Forja</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="vault">
        <NativeTabs.Trigger.Label>Yo</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="conquest">
        <NativeTabs.Trigger.Label>Conquista</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
