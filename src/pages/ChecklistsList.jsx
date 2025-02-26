import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Collapse,
    Box,
    Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Link } from "react-router-dom";
import api from "../services/api";

// Função para obter o content-type da imagem (quando necessário)
const getContentType = async (url) => {
    const res = await fetch(url, { method: "HEAD" });
    return res.headers.get("content-type") || "";
};

// Função para converter uma URL em dataURL (base64)
const fetchFileAsBase64 = async (fileUrl) => {
    const res = await fetch(fileUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Função para adicionar imagem ao PDF usando jsPDF.
// Se o "url" já for um data URI (base64), ele o utiliza diretamente.
const addImageFromURL = async (doc, url, x, y, width, height) => {
    try {
        let base64;
        let format = "PNG";
        if (url.startsWith("data:")) {
            base64 = url;
            // Se o data URI indicar JPEG, ajusta o formato
            if (url.includes("jpeg") || url.includes("jpg")) {
                format = "JPEG";
            }
        } else {
            const ct = await getContentType(url);
            base64 = await fetchFileAsBase64(url);
            if (ct.includes("jpeg") || ct.includes("jpg")) {
                format = "JPEG";
            }
        }
        doc.addImage(base64, format, x, y, width, height);
    } catch (err) {
        console.error("Erro ao adicionar imagem ao PDF:", err);
    }
};

function ChecklistsList() {
    const [checklists, setChecklists] = useState([]);
    const [expandedChecklistId, setExpandedChecklistId] = useState(null);

    useEffect(() => {
        fetchChecklists();
    }, []);

    // 1) Buscar checklists e suas fotos (somente os não deletados)
    const fetchChecklists = async () => {
        try {
            const sessionToken = localStorage.getItem("sessionToken") || "";
            const response = await api.post(
                "/functions/getAllChecklists",
                {},
                { headers: { "X-Parse-Session-Token": sessionToken } }
            );
            if (response.data.result) {
                // Filtra checklists não deletados
                const all = response.data.result.filter((ch) => !ch.isDeleted);
                const enriched = await Promise.all(
                    all.map(async (ch) => {
                        const photosResp = await api.post(
                            "/functions/getChecklistPhotos",
                            { checklistId: ch.objectId },
                            { headers: { "X-Parse-Session-Token": sessionToken } }
                        );
                        const fotos = photosResp.data.result || [];
                        // Presumindo que o backend já retorne a imagem como base64 no campo "base64"
                        return { ...ch, _photos: fotos };
                    })
                );
                setChecklists(enriched);
            }
        } catch (error) {
            console.error("Erro ao buscar checklists:", error);
        }
    };

    // 2) Expandir/recolher detalhes do checklist
    const toggleExpand = (checklistId) => {
        setExpandedChecklistId(expandedChecklistId === checklistId ? null : checklistId);
    };

    // 3) Exportar PDF Resumido (todos os checklists) – sem exibir o ID
    const exportAllToPDF = async () => {
        if (checklists.length === 0) {
            alert("Não há checklists para exportar!");
            return;
        }
        const doc = new jsPDF();
        doc.text("Relatório de Checklists (Resumido)", 14, 10);

        const tableData = checklists.map((ch) => [
            ch.gerador
                ? ch.gerador.serialNumber || ch.gerador.name || "Sem Gerador"
                : "Sem Gerador",
            ch.cliente ? ch.cliente.name || "Sem Cliente" : "Sem Cliente",
            ch.horimetroSaida || "",
            ch.horimetroDevolucao || "",
            ch.dataSaida ? new Date(ch.dataSaida.iso).toLocaleString() : "",
            ch.dataDevolucao ? new Date(ch.dataDevolucao.iso).toLocaleString() : "",
        ]);

        doc.autoTable({
            startY: 20,
            head: [
                [
                    "Gerador",
                    "Cliente",
                    "Horímetro Saída",
                    "Horímetro Devolução",
                    "Data Saída",
                    "Data Devolução",
                ],
            ],
            body: tableData,
        });

        doc.save("checklists_resumido.pdf");
    };

    // 4) Exportar PDF Detalhado de um checklist
    const exportSingleChecklistToPDF = async (checklist) => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(12);
            doc.text(`Checklist Detalhado`, 14, 10);
            let cursorY = 20;

            // 4.1) Informações Gerais (excluindo o ID)
            const infoBody = [
                ["Gerador", checklist.gerador?.serialNumber || checklist.gerador?.name || "Sem Gerador"],
                ["Cliente", checklist.cliente ? checklist.cliente.name || "Sem Cliente" : "Sem Cliente"],
                ["Horímetro Saída", checklist.horimetroSaida || ""],
                ["Horímetro Devolução", checklist.horimetroDevolucao || ""],
                [
                    "Data Saída",
                    checklist.dataSaida ? new Date(checklist.dataSaida.iso).toLocaleString() : "",
                ],
                [
                    "Data Devolução",
                    checklist.dataDevolucao ? new Date(checklist.dataDevolucao.iso).toLocaleString() : "",
                ],
            ];

            doc.autoTable({
                startY: cursorY,
                head: [["Campo", "Valor"]],
                body: infoBody,
                margin: { left: 14 },
            });
            cursorY = doc.lastAutoTable.finalY + 10;

            // 4.2) Seção SAÍDA
            doc.text("Seção: Saída", 14, cursorY);
            cursorY += 5;

            if (checklist.checklistSaida?.length > 0) {
                doc.text("Checklist de Saída", 14, cursorY);
                cursorY += 5;
                const saidaData = checklist.checklistSaida.map((item) => [
                    item.label || "",
                    item.status || "",
                    item.observacao || "",
                ]);
                doc.autoTable({
                    startY: cursorY,
                    head: [["Item", "Status", "Observação"]],
                    body: saidaData,
                    margin: { left: 14 },
                });
                cursorY = doc.lastAutoTable.finalY + 10;
            }

            if (checklist._photos?.length > 0) {
                const fotosSaida = checklist._photos.filter((p) => p.flow === "saida");
                if (fotosSaida.length > 0) {
                    doc.text("Fotos Anexadas - Saída:", 14, cursorY);
                    cursorY += 5;
                    for (let i = 0; i < fotosSaida.length; i++) {
                        const photo = fotosSaida[i];
                        // Usa a imagem em base64 se disponível; caso contrário, tenta usar a URL (que pode falhar em produção)
                        const photoSource = photo.photo?.base64 || photo.photo?.url;
                        if (photoSource) {
                            await addImageFromURL(doc, photoSource, 14, cursorY, 50, 30);
                            cursorY += 40;
                            if (cursorY > 260) {
                                doc.addPage();
                                cursorY = 20;
                            }
                        }
                    }
                }
            }

            if (checklist.signatureClienteSaida) {
                doc.text("Assinatura Cliente (Saída):", 14, cursorY);
                cursorY += 5;
                await addImageFromURL(
                    doc,
                    checklist.signatureClienteSaida?.base64 || checklist.signatureClienteSaida?.url,
                    14,
                    cursorY,
                    50,
                    20
                );
                cursorY += 30;
            }
            if (checklist.signatureLojaSaida) {
                doc.text("Assinatura Loja (Saída):", 14, cursorY);
                cursorY += 5;
                await addImageFromURL(
                    doc,
                    checklist.signatureLojaSaida?.base64 || checklist.signatureLojaSaida?.url,
                    14,
                    cursorY,
                    50,
                    20
                );
                cursorY += 30;
            }

            // 4.3) Seção DEVOLUÇÃO
            doc.text("Seção: Devolução", 14, cursorY);
            cursorY += 5;

            if (checklist.checklistDevolucao?.length > 0) {
                doc.text("Checklist de Devolução", 14, cursorY);
                cursorY += 5;
                const devData = checklist.checklistDevolucao.map((item) => [
                    item.label || "",
                    item.status || "",
                    item.observacao || "",
                ]);
                doc.autoTable({
                    startY: cursorY,
                    head: [["Item", "Status", "Observação"]],
                    body: devData,
                    margin: { left: 14 },
                });
                cursorY = doc.lastAutoTable.finalY + 10;
            }

            if (checklist._photos?.length > 0) {
                const fotosDevolucao = checklist._photos.filter((p) => p.flow === "devolucao");
                if (fotosDevolucao.length > 0) {
                    doc.text("Fotos Anexadas - Devolução:", 14, cursorY);
                    cursorY += 5;
                    for (let i = 0; i < fotosDevolucao.length; i++) {
                        const photo = fotosDevolucao[i];
                        const photoSource = photo.photo?.base64 || photo.photo?.url;
                        if (photoSource) {
                            await addImageFromURL(doc, photoSource, 14, cursorY, 50, 30);
                            cursorY += 40;
                            if (cursorY > 260) {
                                doc.addPage();
                                cursorY = 20;
                            }
                        }
                    }
                }
            }

            if (checklist.signatureClienteDevolucao) {
                doc.text("Assinatura Cliente (Devolução):", 14, cursorY);
                cursorY += 5;
                await addImageFromURL(
                    doc,
                    checklist.signatureClienteDevolucao?.base64 || checklist.signatureClienteDevolucao?.url,
                    14,
                    cursorY,
                    50,
                    20
                );
                cursorY += 30;
            }
            if (checklist.signatureLojaDevolucao) {
                doc.text("Assinatura Loja (Devolução):", 14, cursorY);
                cursorY += 5;
                await addImageFromURL(
                    doc,
                    checklist.signatureLojaDevolucao?.base64 || checklist.signatureLojaDevolucao?.url,
                    14,
                    cursorY,
                    50,
                    20
                );
                cursorY += 30;
            }

            doc.save(`checklist_detalhado.pdf`);
            console.log("PDF gerado com sucesso!");
        } catch (error) {
            console.error("Erro ao gerar PDF detalhado:", error);
            alert("Erro ao gerar PDF detalhado: " + error.message);
        }
    };

    // Função para definir a cor do status, normalizando hífens em espaços
    const getStatusColor = (status) => {
        if (!status) return "inherit";
        const normalizedStatus = status.toLowerCase().replace(/[-_]/g, " ").trim();
        if (
            normalizedStatus.includes("não conforme") ||
            normalizedStatus.includes("nao conforme")
        ) {
            return "red";
        } else if (normalizedStatus.includes("conforme")) {
            return "green";
        }
        return "orange";
    };

    // NOVA FUNÇÃO: Excluir Checklist com Soft Delete e atualizar a lista localmente
    const handleDeleteChecklist = async (checklistId) => {
        if (!window.confirm("Tem certeza que deseja excluir este checklist?")) return;
        try {
            const sessionToken = localStorage.getItem("sessionToken") || "";
            const response = await api.post(
                "/functions/deleteChecklist",
                { checklistId },
                { headers: { "X-Parse-Session-Token": sessionToken } }
            );
            if (response.data.status === "success") {
                alert("Checklist excluído com sucesso!");
                // Atualiza a lista removendo o checklist excluído do estado
                setChecklists((prev) =>
                    prev.filter((ch) => ch.objectId !== checklistId)
                );
            }
        } catch (error) {
            console.error("Erro ao excluir checklist:", error);
            alert("Erro ao excluir checklist: " + error.message);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ mb: 2 }}>
                <Button
                    variant="contained"
                    component={Link}
                    to="/checklistlocacao"
                    sx={{ fontSize: "1.2rem" }}
                >
                    Voltar para ChecklistLocacao
                </Button>
            </Box>

            <Typography variant="h4" gutterBottom sx={{ fontSize: "1.8rem" }}>
                Lista de Checklists
            </Typography>

            <Button
                variant="contained"
                onClick={exportAllToPDF}
                sx={{ mb: 2, fontSize: "1.2rem" }}
            >
                Exportar TODOS (Resumido) PDF
            </Button>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <strong>Gerador</strong>
                        </TableCell>
                        <TableCell>
                            <strong>Cliente</strong>
                        </TableCell>
                        <TableCell>
                            <strong>Data Saída</strong>
                        </TableCell>
                        <TableCell>
                            <strong>Data Devolução</strong>
                        </TableCell>
                        <TableCell>
                            <strong>Ações</strong>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {checklists.map((ch) => {
                        const isExpanded = expandedChecklistId === ch.objectId;
                        return (
                            <React.Fragment key={ch.objectId}>
                                <TableRow>
                                    <TableCell>
                                        {ch.gerador
                                            ? ch.gerador.serialNumber ||
                                            ch.gerador.name ||
                                            "Sem Gerador"
                                            : "Sem Gerador"}
                                    </TableCell>
                                    <TableCell>
                                        {ch.cliente
                                            ? ch.cliente.name || "Cliente sem nome"
                                            : "Sem Cliente"}
                                    </TableCell>
                                    <TableCell>
                                        {ch.dataSaida
                                            ? new Date(ch.dataSaida.iso).toLocaleString()
                                            : ""}
                                    </TableCell>
                                    <TableCell>
                                        {ch.dataDevolucao
                                            ? new Date(ch.dataDevolucao.iso).toLocaleString()
                                            : ""}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            onClick={() => exportSingleChecklistToPDF(ch)}
                                            sx={{ mr: 1, fontSize: "1rem" }}
                                        >
                                            PDF Detalhado
                                        </Button>
                                        <Button
                                            variant="text"
                                            onClick={() => toggleExpand(ch.objectId)}
                                            sx={{ fontSize: "1rem", mr: 1 }}
                                        >
                                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleDeleteChecklist(ch.objectId)}
                                            sx={{ fontSize: "1rem" }}
                                        >
                                            Excluir
                                        </Button>
                                    </TableCell>
                                </TableRow>

                                {/* Linha expandida com detalhes */}
                                <TableRow>
                                    <TableCell colSpan={5} style={{ padding: 0 }}>
                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                            <Box sx={{ m: 2 }}>
                                                <Typography variant="h6" sx={{ fontSize: "1.3rem", mb: 1 }}>
                                                    Horímetro Saída: {ch.horimetroSaida || "--"}
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontSize: "1.3rem", mb: 2 }}>
                                                    Horímetro Devolução: {ch.horimetroDevolucao || "--"}
                                                </Typography>

                                                {/* Seção: Saída */}
                                                <Paper sx={{ p: 2, mb: 2, backgroundColor: "#e3f2fd" }}>
                                                    <Typography variant="h6" sx={{ fontSize: "1.4rem", mb: 1 }}>
                                                        Seção: Saída
                                                    </Typography>
                                                    {ch.checklistSaida?.length > 0 && (
                                                        <>
                                                            <Typography variant="subtitle1" sx={{ fontSize: "1.3rem", mb: 1 }}>
                                                                Checklist de Saída:
                                                            </Typography>
                                                            {ch.checklistSaida.map((item, idx) => (
                                                                <Box key={idx} sx={{ ml: 1, mb: 1 }}>
                                                                    <Typography
                                                                        component="span"
                                                                        variant="body1"
                                                                        sx={{ fontSize: "1.2rem", fontWeight: "bold" }}
                                                                    >
                                                                        {item.label}:
                                                                    </Typography>
                                                                    <Typography
                                                                        component="span"
                                                                        variant="body1"
                                                                        sx={{
                                                                            fontSize: "1.2rem",
                                                                            fontWeight: "bold",
                                                                            ml: 1,
                                                                            color: getStatusColor(item.status),
                                                                        }}
                                                                    >
                                                                        {item.status}
                                                                    </Typography>
                                                                    {item.observacao && (
                                                                        <Typography
                                                                            component="span"
                                                                            variant="body1"
                                                                            sx={{ fontSize: "1.2rem", ml: 1 }}
                                                                        >
                                                                            ({item.observacao})
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ))}
                                                        </>
                                                    )}
                                                    {ch._photos &&
                                                        ch._photos.filter((p) => p.flow === "saida").length > 0 && (
                                                            <Box sx={{ mt: 1 }}>
                                                                <Typography variant="subtitle1" sx={{ fontSize: "1.3rem" }}>
                                                                    Fotos da Saída:
                                                                </Typography>
                                                                <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                                                                    {ch._photos
                                                                        .filter((p) => p.flow === "saida")
                                                                        .map((photoObj) => {
                                                                            // Usa o campo base64 já retornado do backend
                                                                            const photoSource =
                                                                                photoObj.photo?.base64 || photoObj.photo?.url;
                                                                            if (!photoSource) return null;
                                                                            return (
                                                                                <img
                                                                                    key={photoObj.objectId}
                                                                                    src={photoSource}
                                                                                    alt="Foto Saída"
                                                                                    style={{
                                                                                        width: 120,
                                                                                        height: "auto",
                                                                                        border: "1px solid #ccc",
                                                                                    }}
                                                                                />
                                                                            );
                                                                        })}
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    {ch.signatureClienteSaida && (
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontSize: "1.3rem" }}>
                                                                Assinatura Cliente (Saída):
                                                            </Typography>
                                                            <img
                                                                src={
                                                                    ch.signatureClienteSaida?.base64 ||
                                                                    ch.signatureClienteSaida?.url
                                                                }
                                                                alt="Assinatura Cliente Saída"
                                                                style={{ width: 180, border: "1px solid #ccc" }}
                                                            />
                                                        </Box>
                                                    )}
                                                    {ch.signatureLojaSaida && (
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontSize: "1.3rem" }}>
                                                                Assinatura Loja (Saída):
                                                            </Typography>
                                                            <img
                                                                src={
                                                                    ch.signatureLojaSaida?.base64 ||
                                                                    ch.signatureLojaSaida?.url
                                                                }
                                                                alt="Assinatura Loja Saída"
                                                                style={{ width: 180, border: "1px solid #ccc" }}
                                                            />
                                                        </Box>
                                                    )}
                                                </Paper>

                                                {/* Seção: Devolução */}
                                                <Paper sx={{ p: 2, mb: 2, backgroundColor: "#e8f5e9" }}>
                                                    <Typography variant="h6" sx={{ fontSize: "1.4rem", mb: 1 }}>
                                                        Seção: Devolução
                                                    </Typography>
                                                    {ch.checklistDevolucao?.length > 0 && (
                                                        <>
                                                            <Typography variant="subtitle1" sx={{ fontSize: "1.3rem", mb: 1 }}>
                                                                Checklist de Devolução:
                                                            </Typography>
                                                            {ch.checklistDevolucao.map((item, idx) => (
                                                                <Box key={idx} sx={{ ml: 1, mb: 1 }}>
                                                                    <Typography
                                                                        component="span"
                                                                        variant="body1"
                                                                        sx={{ fontSize: "1.2rem", fontWeight: "bold" }}
                                                                    >
                                                                        {item.label}:
                                                                    </Typography>
                                                                    <Typography
                                                                        component="span"
                                                                        variant="body1"
                                                                        sx={{
                                                                            fontSize: "1.2rem",
                                                                            fontWeight: "bold",
                                                                            ml: 1,
                                                                            color: getStatusColor(item.status),
                                                                        }}
                                                                    >
                                                                        {item.status}
                                                                    </Typography>
                                                                    {item.observacao && (
                                                                        <Typography
                                                                            component="span"
                                                                            variant="body1"
                                                                            sx={{ fontSize: "1.2rem", ml: 1 }}
                                                                        >
                                                                            ({item.observacao})
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ))}
                                                        </>
                                                    )}
                                                    {ch._photos &&
                                                        ch._photos.filter((p) => p.flow === "devolucao").length > 0 && (
                                                            <Box sx={{ mt: 1 }}>
                                                                <Typography variant="subtitle1" sx={{ fontSize: "1.3rem" }}>
                                                                    Fotos da Devolução:
                                                                </Typography>
                                                                <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                                                                    {ch._photos
                                                                        .filter((p) => p.flow === "devolucao")
                                                                        .map((photoObj) => {
                                                                            const photoSource =
                                                                                photoObj.photo?.base64 || photoObj.photo?.url;
                                                                            if (!photoSource) return null;
                                                                            return (
                                                                                <img
                                                                                    key={photoObj.objectId}
                                                                                    src={photoSource}
                                                                                    alt="Foto Devolução"
                                                                                    style={{
                                                                                        width: 120,
                                                                                        height: "auto",
                                                                                        border: "1px solid #ccc",
                                                                                    }}
                                                                                />
                                                                            );
                                                                        })}
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    {ch.signatureClienteDevolucao && (
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontSize: "1.3rem" }}>
                                                                Assinatura Cliente (Devolução):
                                                            </Typography>
                                                            <img
                                                                src={
                                                                    ch.signatureClienteDevolucao?.base64 ||
                                                                    ch.signatureClienteDevolucao?.url
                                                                }
                                                                alt="Assinatura Cliente Devolução"
                                                                style={{ width: 180, border: "1px solid #ccc" }}
                                                            />
                                                        </Box>
                                                    )}
                                                    {ch.signatureLojaDevolucao && (
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontSize: "1.3rem" }}>
                                                                Assinatura Loja (Devolução):
                                                            </Typography>
                                                            <img
                                                                src={
                                                                    ch.signatureLojaDevolucao?.base64 ||
                                                                    ch.signatureLojaDevolucao?.url
                                                                }
                                                                alt="Assinatura Loja Devolução"
                                                                style={{ width: 180, border: "1px solid #ccc" }}
                                                            />
                                                        </Box>
                                                    )}
                                                </Paper>
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        );
                    })}
                    {checklists.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                Nenhum checklist encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Container>
    );
}

export default ChecklistsList;
