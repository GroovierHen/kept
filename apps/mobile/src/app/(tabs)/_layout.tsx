import { Tabs } from 'expo-router'
import { LedgerIcon, TodayIcon } from '@/components/ui/tab-icons'
import { copy } from '@/copy'
import { useMe } from '@/hooks/use-kept-data'
import { colors, fontFamily } from '@/lib/theme'

// Today and the Ledger, the web's two signed-in tabs (AppShell). Setup comes
// first: until it's finished the tab bar stays hidden, as the web keeps
// setup apart from the app shell.
export default function TabsLayout() {
	const me = useMe()
	const isSetUp = me.data != null && me.data.setupStep == null
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: colors.bg },
				tabBarActiveTintColor: colors.accent,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarLabelStyle: { fontFamily: fontFamily.textMedium },
				tabBarStyle: isSetUp
					? { backgroundColor: colors.surface, borderTopColor: colors.border }
					: { display: 'none' }
			}}
		>
			<Tabs.Screen
				name="index"
				options={{ title: copy.tabs.today, tabBarIcon: ({ color }) => <TodayIcon color={color} /> }}
			/>
			<Tabs.Screen
				name="ledger"
				options={{
					title: copy.tabs.ledger,
					tabBarIcon: ({ color }) => <LedgerIcon color={color} />
				}}
			/>
		</Tabs>
	)
}
