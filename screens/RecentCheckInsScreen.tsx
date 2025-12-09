"use client"

import type React from "react"
import { useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { databaseService, type Attendance, type Visitor, type Service } from "../services/database"

type RecentCheckInsScreenNavigationProp = StackNavigationProp<RootStackParamList, "RecentCheckIns">

interface Props {
  navigation: RecentCheckInsScreenNavigationProp
}

interface CheckInRecord extends Attendance {
  visitor: Visitor
  service: Service
}

const RecentCheckInsScreen: React.FC<Props> = ({ navigation }) => {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadRecentCheckIns = async () => {
    try {
      const recent = await databaseService.getRecentCheckIns(100)
      setCheckIns(recent)
    } catch (error) {
      console.error("Error loading recent check-ins:", error)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadRecentCheckIns()
    }, []),
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRecentCheckIns()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={[styles.headerCell, styles.nameCell]}>
        <Text style={styles.headerText}>Name</Text>
      </View>
      <View style={[styles.headerCell, styles.phoneCell]}>
        <Text style={styles.headerText}>Phone</Text>
      </View>
      <View style={[styles.headerCell, styles.serviceCell]}>
        <Text style={styles.headerText}>Service</Text>
      </View>
      <View style={[styles.headerCell, styles.dateCell]}>
        <Text style={styles.headerText}>Date</Text>
      </View>
      <View style={[styles.headerCell, styles.timeCell]}>
        <Text style={styles.headerText}>Time</Text>
      </View>
    </View>
  )

  const renderCheckInRow = ({ item, index }: { item: CheckInRecord; index: number }) => (
    <View style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
      <View style={[styles.cell, styles.nameCell]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {item.visitor.first_name} {item.visitor.last_name}
        </Text>
      </View>
      <View style={[styles.cell, styles.phoneCell]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {item.visitor.phone || "-"}
        </Text>
      </View>
      <View style={[styles.cell, styles.serviceCell]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {item.service.service_type_name || "-"}
        </Text>
      </View>
      <View style={[styles.cell, styles.dateCell]}>
        <Text style={styles.cellText}>{formatDate(item.checked_in_at)}</Text>
      </View>
      <View style={[styles.cell, styles.timeCell]}>
        <Text style={styles.cellText}>{formatTime(item.checked_in_at)}</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Recent Check-ins</Text>
        <Text style={styles.summaryCount}>Total: {checkIns.length}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          {checkIns.length > 0 ? (
            <FlatList
              data={checkIns}
              renderItem={({ item, index }) => renderCheckInRow({ item, index })}
              keyExtractor={(item) => item.local_id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No check-ins found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 16,
    color: "#64748b",
  },
  scrollView: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#6366f1",
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#4f46e5",
    justifyContent: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    justifyContent: "center",
  },
  cellText: {
    fontSize: 13,
    color: "#1e293b",
    textAlign: "center",
  },
  nameCell: {
    width: 150,
    minWidth: 150,
  },
  phoneCell: {
    width: 120,
    minWidth: 120,
  },
  serviceCell: {
    width: 180,
    minWidth: 180,
  },
  dateCell: {
    width: 110,
    minWidth: 110,
  },
  timeCell: {
    width: 90,
    minWidth: 90,
    borderRightWidth: 0,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
})

export default RecentCheckInsScreen

