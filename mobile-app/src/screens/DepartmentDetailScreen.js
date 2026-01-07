import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import apiService from "../api/apiService";

export default function DepartmentDetailScreen({ route }) {
    const id = route?.params?.id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await apiService.getDepartment(id);
            setData(res?.department || null);
        } catch (e) {
            setErrorMsg(e?.message || "Failed to load department");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const employees = data?.employees || [];

    return (
        <View style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
            {errorMsg ? (
                <View style={{ padding: 12 }}>
                    <Text style={{ color: "red" }}>{errorMsg}</Text>
                </View>
            ) : null}

            <View style={{ padding: 14, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#eee" }}>
                <Text style={{ fontSize: 18, fontWeight: "700" }}>{data?.name || "Department"}</Text>
                {!!data?.description && (
                    <Text style={{ marginTop: 6, color: "#555" }}>{data.description}</Text>
                )}
                <Text style={{ marginTop: 8, color: "#777", fontSize: 12 }}>
                    Employees: {employees.length}
                </Text>
            </View>

            <FlatList
                data={employees}
                keyExtractor={(item) => String(item.id)}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                renderItem={({ item }) => (
                    <View style={{ padding: 14, borderBottomWidth: 1, borderColor: "#eee", backgroundColor: "white" }}>
                        <Text style={{ fontSize: 15, fontWeight: "600" }}>{item.full_name}</Text>
                        {!!item.job_title && <Text style={{ marginTop: 4, color: "#555" }}>{item.job_title}</Text>}
                    </View>
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ padding: 20 }}>
                            <Text style={{ color: "#555" }}>No employees in this department.</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}
