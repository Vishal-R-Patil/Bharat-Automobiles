const { ObjectId } = require("mongodb");
const { getMongoDb } = require("../config/mongodb");
const {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} = require("../utils/cloudinaryService");

const collection = async () =>
{
  const db = await getMongoDb();
  return db.collection("supplybook_suppliers");
};

const toObjectId = (id) =>
{
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
};

const serializeAttachment = (attachment) => ({
  id: attachment._id.toString(),
  file_url: attachment.file_url,
  uploaded_at: attachment.uploaded_at,
});

const serializeDelivery = (delivery) => ({
  id: delivery._id.toString(),
  invoice_number: delivery.invoice_number || null,
  issued_date: delivery.issued_date || null,
  delivery_date: delivery.delivery_date || null,
  total_cost: delivery.total_cost || 0,
  attachments: (delivery.attachments || []).map(serializeAttachment),
});

const serializePayment = (payment) => ({
  id: payment._id.toString(),
  payment_date: payment.payment_date,
  amount: payment.amount || 0,
  payment_method: payment.payment_method || null,
  note: payment.note || null,
  created_at: payment.created_at,
  attachments: (payment.attachments || []).map(serializeAttachment),
});

const serializeSupplier = (supplier) =>
{
  const deliveries = supplier.deliveries || [];
  const lastDelivery = deliveries
    .map((delivery) => ({
      id: delivery._id,
      date: delivery.issued_date || delivery.delivery_date,
    }))
    .filter((delivery) => delivery.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  return {
    id: supplier._id.toString(),
    name: supplier.name,
    gst_no: supplier.gst_no || null,
    phone: supplier.phone || null,
    email: supplier.email || null,
    last_interaction_at: lastDelivery?.date || null,
    last_interaction_id: lastDelivery?.id?.toString() || null,
  };
};

const getSummary = (deliveries, payments) =>
{
  const totalSupplies = deliveries.reduce(
    (sum, delivery) => sum + Number(delivery.total_cost || 0),
    0
  );
  const totalPayments = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  return {
    totalSupplies,
    totalPayments,
    balance: totalSupplies - totalPayments,
  };
};

exports.getSuppliers = async (req, res) =>
{
  try
  {
    const suppliers = await (await collection())
      .find({})
      .sort({ updated_at: -1, name: 1 })
      .toArray();

    res.json(suppliers.map(serializeSupplier));
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch SupplyBook suppliers" });
  }
};

exports.addSupplier = async (req, res) =>
{
  try
  {
    const { name, gst_no, phone, email } = req.body;

    if (!name)
    {
      return res.status(400).json({ error: "Supplier name required" });
    }

    const now = new Date();
    const result = await (await collection()).insertOne({
      name: name.trim(),
      gst_no: gst_no || null,
      phone: phone || null,
      email: email || null,
      deliveries: [],
      payments: [],
      created_at: now,
      updated_at: now,
    });

    res.status(201).json({ message: "Supplier added", id: result.insertedId });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to add SupplyBook supplier" });
  }
};

exports.updateSupplier = async (req, res) =>
{
  try
  {
    const supplierId = toObjectId(req.params.id);
    if (!supplierId) return res.status(400).json({ error: "Invalid supplier id" });

    const { name, gst_no, phone, email } = req.body;
    const update = {};

    if (name) update.name = name.trim();
    if (gst_no !== undefined) update.gst_no = gst_no || null;
    if (phone !== undefined) update.phone = phone || null;
    if (email !== undefined) update.email = email || null;

    if (Object.keys(update).length === 0)
    {
      return res.status(400).json({ error: "No supplier details provided to update" });
    }

    const now = new Date();
    const result = await (await collection()).updateOne(
      { _id: supplierId },
      { $set: { ...update, updated_at: now } }
    );

    if (result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({ message: "Supplier updated" });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to update supplier" });
  }
};

exports.deleteSupplier = async (req, res) =>
{
  try
  {
    const supplierId = toObjectId(req.params.id);
    if (!supplierId) return res.status(400).json({ error: "Invalid supplier id" });

    const suppliers = await collection();
    const supplier = await suppliers.findOne({ _id: supplierId });
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    const attachmentUrls = [
      ...(supplier.deliveries || []).flatMap((delivery) =>
        (delivery.attachments || []).map((attachment) => attachment.file_url)
      ),
      ...(supplier.payments || []).flatMap((payment) =>
        (payment.attachments || []).map((attachment) => attachment.file_url)
      ),
    ];

    await Promise.all(
      attachmentUrls.map((fileUrl) => deleteImageFromCloudinary(fileUrl))
    );
    await suppliers.deleteOne({ _id: supplierId });

    res.json({ message: "SupplyBook supplier deleted" });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to delete SupplyBook supplier" });
  }
};

exports.getSupplierLedger = async (req, res) =>
{
  try
  {
    const supplierId = toObjectId(req.params.id);
    if (!supplierId) return res.status(400).json({ error: "Invalid supplier id" });

    const supplier = await (await collection()).findOne({ _id: supplierId });
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    const deliveries = (supplier.deliveries || [])
      .map(serializeDelivery)
      .sort((a, b) => new Date(b.issued_date || b.delivery_date || 0) - new Date(a.issued_date || a.delivery_date || 0));
    const payments = (supplier.payments || [])
      .map(serializePayment)
      .sort((a, b) => new Date(b.payment_date || 0) - new Date(a.payment_date || 0));

    res.json({
      supplier: serializeSupplier(supplier),
      deliveries,
      payments,
      summary: getSummary(deliveries, payments),
    });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch SupplyBook ledger" });
  }
};

exports.addDelivery = async (req, res) =>
{
  try
  {
    const supplierId = toObjectId(req.params.id);
    if (!supplierId) return res.status(400).json({ error: "Invalid supplier id" });

    const { invoice_number, issued_date, delivery_date, total_cost } = req.body;
    if (!total_cost)
    {
      return res.status(400).json({ error: "Supply amount is required" });
    }
    if (!issued_date)
    {
      return res.status(400).json({ error: "Issued date is required" });
    }

    const attachmentUrl = await uploadImageToCloudinary(req.file);
    const now = new Date();
    const delivery = {
      _id: new ObjectId(),
      invoice_number: invoice_number || null,
      issued_date,
      delivery_date: delivery_date || issued_date,
      total_cost: Number(total_cost),
      attachments: attachmentUrl
        ? [{ _id: new ObjectId(), file_url: attachmentUrl, uploaded_at: now }]
        : [],
      created_at: now,
    };

    const result = await (await collection()).updateOne(
      { _id: supplierId },
      {
        $push: { deliveries: delivery },
        $set: { updated_at: now },
      }
    );

    if (result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.status(201).json({ message: "Supply bill added", id: delivery._id });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({
      error: "Failed to add supply bill",
      details: err.message,
    });
  }
};

exports.addPayment = async (req, res) =>
{
  try
  {
    const supplierId = toObjectId(req.params.id);
    if (!supplierId) return res.status(400).json({ error: "Invalid supplier id" });

    const { payment_date, amount, payment_method, note } = req.body;
    if (!payment_date || !amount)
    {
      return res
        .status(400)
        .json({ error: "Payment date and amount are required" });
    }

    const attachmentUrl = await uploadImageToCloudinary(req.file);
    const now = new Date();
    const payment = {
      _id: new ObjectId(),
      payment_date,
      amount: Number(amount),
      payment_method: payment_method || null,
      note: note || null,
      attachments: attachmentUrl
        ? [{ _id: new ObjectId(), file_url: attachmentUrl, uploaded_at: now }]
        : [],
      created_at: now,
    };

    const result = await (await collection()).updateOne(
      { _id: supplierId },
      {
        $push: { payments: payment },
        $set: { updated_at: now },
      }
    );

    if (result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.status(201).json({ message: "Supplier payment added", id: payment._id });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({
      error: "Failed to add supplier payment",
      details: err.message,
    });
  }
};

exports.updateTransaction = async (req, res) =>
{
  try
  {
    const supplierId = toObjectId(req.params.id);
    if (!supplierId) return res.status(400).json({ error: "Invalid supplier id" });

    const { entity_type, entity_id, invoice_number, issued_date, delivery_date, payment_method, note } = req.body;
    const entityId = toObjectId(entity_id);
    const validEntityTypes = ["supply_delivery", "supplier_payment"];

    if (!validEntityTypes.includes(entity_type) || !entityId)
    {
      return res.status(400).json({ error: "Valid entity type and entity id are required" });
    }

    const updateFields = {};
    if (entity_type === "supply_delivery")
    {
      if (invoice_number !== undefined) updateFields["deliveries.$.invoice_number"] = invoice_number || null;
      if (issued_date !== undefined) updateFields["deliveries.$.issued_date"] = issued_date || null;
      if (delivery_date !== undefined) updateFields["deliveries.$.delivery_date"] = delivery_date || null;
    } else
    {
      if (payment_method !== undefined) updateFields["payments.$.payment_method"] = payment_method || null;
      if (note !== undefined) updateFields["payments.$.note"] = note || null;
    }

    if (Object.keys(updateFields).length === 0)
    {
      return res.status(400).json({ error: "No transaction fields provided to update" });
    }

    const result = await (await collection()).updateOne(
      entity_type === "supply_delivery"
        ? { "deliveries._id": entityId }
        : { "payments._id": entityId },
      {
        $set: {
          ...updateFields,
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction updated" });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to update transaction", details: err.message });
  }
};

exports.deleteTransaction = async (req, res) =>
{
  try
  {
    const supplierId = toObjectId(req.params.id);
    if (!supplierId) return res.status(400).json({ error: "Invalid supplier id" });

    const { entity_type, entity_id } = req.query;
    const entityId = toObjectId(entity_id);
    const validEntityTypes = ["supply_delivery", "supplier_payment"];

    if (!validEntityTypes.includes(entity_type) || !entityId)
    {
      return res.status(400).json({ error: "Valid entity type and entity id are required" });
    }

    const suppliers = await collection();
    const supplier = await suppliers.findOne({ _id: supplierId });
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    let item;
    if (entity_type === "supply_delivery")
    {
      item = (supplier.deliveries || []).find((delivery) => delivery._id.equals(entityId));
    } else
    {
      item = (supplier.payments || []).find((payment) => payment._id.equals(entityId));
    }

    if (!item)
    {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const attachmentUrls = (item.attachments || []).map((attachment) => attachment.file_url);
    await Promise.all(attachmentUrls.map((fileUrl) => deleteImageFromCloudinary(fileUrl)));

    const pullPath = entity_type === "supply_delivery" ? { deliveries: { _id: entityId } } : { payments: { _id: entityId } };
    const result = await suppliers.updateOne(
      { _id: supplierId },
      {
        $pull: pullPath,
        $set: { updated_at: new Date() },
      }
    );

    if (result.modifiedCount === 0)
    {
      return res.status(500).json({ error: "Failed to delete transaction" });
    }

    res.json({ message: "Transaction deleted" });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transaction", details: err.message });
  }
};

exports.addAttachment = async (req, res) =>
{
  try
  {
    const { entity_type, entity_id } = req.body;
    const entityId = toObjectId(entity_id);
    const validEntityTypes = ["supply_delivery", "supplier_payment"];

    if (!validEntityTypes.includes(entity_type) || !entityId || !req.file)
    {
      return res.status(400).json({
        error: "Valid entity type, entity id, and image file are required",
      });
    }

    const attachmentUrl = await uploadImageToCloudinary(req.file);
    const attachment = {
      _id: new ObjectId(),
      file_url: attachmentUrl,
      uploaded_at: new Date(),
    };
    const path =
      entity_type === "supply_delivery"
        ? "deliveries.$.attachments"
        : "payments.$.attachments";
    const filter =
      entity_type === "supply_delivery"
        ? { "deliveries._id": entityId }
        : { "payments._id": entityId };

    const result = await (await collection()).updateOne(filter, {
      $push: { [path]: attachment },
      $set: { updated_at: new Date() },
    });

    if (result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.status(201).json({ message: "Attachment added", id: attachment._id });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({
      error: "Failed to add attachment",
      details: err.message,
    });
  }
};

exports.deleteAttachment = async (req, res) =>
{
  try
  {
    const attachmentId = toObjectId(req.params.id);
    if (!attachmentId)
    {
      return res.status(400).json({ error: "Invalid attachment id" });
    }

    const suppliers = await collection();
    const supplier = await suppliers.findOne({
      $or: [
        { "deliveries.attachments._id": attachmentId },
        { "payments.attachments._id": attachmentId },
      ],
    });

    if (!supplier) return res.status(404).json({ error: "Attachment not found" });

    const deliveryAttachment = (supplier.deliveries || [])
      .flatMap((delivery) => delivery.attachments || [])
      .find((attachment) => attachment._id.equals(attachmentId));
    const paymentAttachment = (supplier.payments || [])
      .flatMap((payment) => payment.attachments || [])
      .find((attachment) => attachment._id.equals(attachmentId));
    const attachment = deliveryAttachment || paymentAttachment;

    await deleteImageFromCloudinary(attachment.file_url);

    await suppliers.updateOne(
      { _id: supplier._id },
      {
        $pull: {
          "deliveries.$[].attachments": { _id: attachmentId },
          "payments.$[].attachments": { _id: attachmentId },
        },
        $set: { updated_at: new Date() },
      }
    );

    res.json({ message: "Attachment deleted" });
  } catch (err)
  {
    console.error(err);
    res.status(500).json({
      error: "Failed to delete attachment",
      details: err.message,
    });
  }
};

exports.getBills = async (req, res) =>
{
  try
  {
    const { supplier_id, type = "both" } = req.query;
    const supplierId = supplier_id ? toObjectId(supplier_id) : null;
    const suppliers = await (await collection())
      .find(supplierId ? { _id: supplierId } : {})
      .toArray();

    const rows = suppliers.flatMap((supplier) =>
    {
      const supplyBills =
        type === "payment"
          ? []
          : (supplier.deliveries || []).flatMap((delivery) =>
            (delivery.attachments || []).map((attachment) => ({
              id: attachment._id.toString(),
              file_url: attachment.file_url,
              uploaded_at: attachment.uploaded_at,
              bill_type: "supply",
              entity_id: delivery._id.toString(),
              invoice_number: delivery.invoice_number || null,
              amount: delivery.total_cost || 0,
              transaction_date: delivery.issued_date || delivery.delivery_date,
              supplier_id: supplier._id.toString(),
              supplier_name: supplier.name,
            }))
          );
      const paymentBills =
        type === "supply"
          ? []
          : (supplier.payments || []).flatMap((payment) =>
            (payment.attachments || []).map((attachment) => ({
              id: attachment._id.toString(),
              file_url: attachment.file_url,
              uploaded_at: attachment.uploaded_at,
              bill_type: "payment",
              entity_id: payment._id.toString(),
              invoice_number: null,
              amount: payment.amount || 0,
              transaction_date: payment.payment_date,
              supplier_id: supplier._id.toString(),
              supplier_name: supplier.name,
            }))
          );

      return [...supplyBills, ...paymentBills];
    });

    rows.sort((a, b) =>
    {
      const dateDiff =
        new Date(b.transaction_date || 0) - new Date(a.transaction_date || 0);
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
    });

    res.json(rows);
  } catch (err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch SupplyBook bills" });
  }
};
