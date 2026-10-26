
"use client";

import { useCallback, useEffect, useState } from "react";

const API = "/api";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  reviewer_name: "",
  rating: 5,
  comment: "",
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/products`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Gagal mengambil produk.");
      }

      // Mendukung API yang mengembalikan array langsung
      // maupun { data: [...] }.
      const list = Array.isArray(data) ? data : data.data;

      if (!Array.isArray(list)) {
        throw new Error("Format data produk dari API tidak sesuai.");
      }

      setProducts(list);
    } catch (err) {
      setError(err.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "rating" ? Number(value) : value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      reviewer_name: product.reviewer_name || "",
      rating: Number(product.rating ?? 5),
      comment: product.comment || "",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      reviewer_name: form.reviewer_name.trim() || null,
      rating: Number(form.rating),
      comment: form.comment.trim() || null,
    };

    if (!payload.name) {
      setError("Nama produk wajib diisi.");
      setSaving(false);
      return;
    }

    if (form.price === "" || !Number.isFinite(payload.price) || payload.price < 0) {
      setError("Harga harus berupa angka nol atau lebih.");
      setSaving(false);
      return;
    }

    if (payload.rating < 1 || payload.rating > 5) {
      setError("Rating harus antara 1 sampai 5.");
      setSaving(false);
      return;
    }

    try {
      const url = editingId
        ? `${API}/products/${editingId}`
        : `${API}/products`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Gagal menyimpan produk. Periksa API backend."
        );
      }

      setMessage(
        editingId
          ? "Produk dan review berhasil diperbarui."
          : "Produk dan review berhasil ditambahkan."
      );

      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Yakin ingin menghapus produk ini?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Gagal menghapus produk."
        );
      }

      setMessage("Produk berhasil dihapus.");

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await loadProducts();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menghapus.");
    }
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    }).format(Number(price || 0));
  }

  function renderStars(rating) {
    const value = Math.min(5, Math.max(0, Number(rating || 0)));

    return (
      <span
        className="stars"
        aria-label={`Rating ${value} dari 5`}
      >
        {"★".repeat(value)}
        <span className="empty-stars">
          {"★".repeat(5 - value)}
        </span>
      </span>
    );
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <div className="brand-icon">P</div>
        <div>
          <p className="eyebrow">PRODUCT MANAGEMENT</p>
          <h1>Product & Review</h1>
          <p className="subtitle">
            Kelola produk beserta rating dan review dalam satu tabel.
          </p>
        </div>
      </header>

      {message && (
        <div className="alert success" role="status">
          <span>✓</span> {message}
        </div>
      )}

      {error && (
        <div className="alert danger" role="alert">
          <span>!</span> {error}
        </div>
      )}

      <section className="card form-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {editingId ? "EDIT DATA" : "DATA BARU"}
            </p>
            <h2>{editingId ? "Edit Produk" : "Tambah Produk"}</h2>
            <p className="section-description">
              Isi informasi produk dan review-nya.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="button button-light"
              onClick={resetForm}
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="name">Nama Produk *</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Contoh: Tas Kanvas"
                required
              />
            </div>

            <div className="field field-full">
              <label htmlFor="description">Deskripsi Produk</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Jelaskan produk..."
                rows={3}
              />
            </div>

            <div className="field">
              <label htmlFor="price">Harga (Rp) *</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="50000"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="reviewer_name">Nama Reviewer</label>
              <input
                id="reviewer_name"
                name="reviewer_name"
                value={form.reviewer_name}
                onChange={handleChange}
                placeholder="Nama pemberi review"
              />
            </div>
          </div>

          <div className="review-input-panel">
            <div className="review-panel-heading">
              <div className="review-icon">★</div>
              <div>
                <h3>Review Produk</h3>
                <p>Berikan rating dan komentar untuk produk ini.</p>
              </div>
            </div>

            <div className="field rating-field">
              <label>Rating Produk</label>

              <div className="rating-picker" aria-label="Pilih rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`star-button ${
                      star <= form.rating ? "active" : ""
                    }`}
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        rating: star,
                      }))
                    }
                    aria-label={`${star} bintang`}
                    aria-pressed={form.rating === star}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-number">
                  {form.rating}/5
                </span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="comment">Komentar Review</label>
              <textarea
                id="comment"
                name="comment"
                value={form.comment}
                onChange={handleChange}
                placeholder="Tulis pendapat tentang produk..."
                rows={3}
              />
            </div>

            <p className="form-note">
              Nama reviewer dan komentar boleh dikosongkan.
              Jika tidak memilih rating, nilai awalnya 5 bintang.
            </p>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={saving}
            >
              {saving
                ? "Menyimpan..."
                : editingId
                  ? "Simpan Perubahan"
                  : "＋ Simpan Produk"}
            </button>

            <button
              type="button"
              className="button button-light"
              onClick={resetForm}
              disabled={saving}
            >
              Reset Form
            </button>
          </div>
        </form>
      </section>

      <section className="card products-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DATABASE</p>
            <h2>Daftar Produk</h2>
            <p className="section-description">
              Data produk dan review yang tersimpan.
            </p>
          </div>

          <div className="total-badge">
            <span>{products.length}</span> produk
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loader" />
            <p>Memuat data produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▤</div>
            <h3>Belum ada produk</h3>
            <p>Tambahkan produk pertama melalui form di atas.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Harga</th>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Komentar</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-name">
                        {product.name}
                      </div>
                      <div className="product-description">
                        {product.description || "Tidak ada deskripsi"}
                      </div>
                      <span className="product-id">
                        ID #{product.id}
                      </span>
                    </td>

                    <td className="price-cell">
                      {formatPrice(product.price)}
                    </td>

                    <td>
                      {product.reviewer_name || (
                        <span className="muted">Belum ada</span>
                      )}
                    </td>

                    <td>
                      <div className="rating-display">
                        {renderStars(product.rating)}
                        <span className="rating-value">
                          {Number(product.rating ?? 5)}/5
                        </span>
                      </div>
                    </td>

                    <td className="comment-cell">
                      {product.comment || (
                        <span className="muted">Belum ada komentar</span>
                      )}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="button button-edit"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="button button-delete"
                          onClick={() => handleDelete(product.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="page-footer">
        <span>Product Management</span>
        <span>•</span>
        <span>Product & Review CRUD</span>
      </footer>
    </main>
  );
}
